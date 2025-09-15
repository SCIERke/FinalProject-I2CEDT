import axios from "axios";

/** Round to 0.5 increments like IELTS */
const roundToHalf = (n) => Math.round(n * 2) / 2;

/** Simple mock evaluator if no OpenAI key */
function mockEvaluate(essay) {
  console.log("Using mock evaluator");
  const words = (essay || "").trim().split(/\s+/).filter(Boolean).length;
  const uniqWords = new Set(
    (essay || "").toLowerCase().match(/\b[a-z']+\b/g) || []
  ).size;

  // heuristic scores
  let base = 5;
  if (words >= 250) base += 1;
  if (words >= 350) base += 1;
  if (uniqWords / Math.max(1, words) > 0.35) base += 0.5;

  const taskResponseScore = Math.min(9, base + (words > 200 ? 0.5 : 0));
  const coherenceScore = Math.min(9, base + (words > 180 ? 0.5 : 0));
  const lexicalScore = Math.min(
    9,
    base - 0.5 + (uniqWords / Math.max(1, words)) * 3
  );
  const grammarScore = Math.min(9, base - (words < 150 ? 0.5 : 0));

  // per-criterion feedback
  const criteria = {
    taskResponse: {
      score: roundToHalf(taskResponseScore),
      feedback:
        words < 200
          ? "Essayes is short — try to write more (target ~250 words)."
          : "Good length. Ensure all parts of the task are addressed.",
    },
    coherence: {
      score: roundToHalf(coherenceScore),
      feedback:
        coherenceScore < 6
          ? "Improve paragraphing and linking words."
          : "Logical organization and clear linking present.",
    },
    lexical: {
      score: roundToHalf(lexicalScore),
      feedback:
        lexicalScore < 6
          ? "Work on vocabulary variety and collocations."
          : "Good range of vocabulary.",
    },
    grammar: {
      score: roundToHalf(grammarScore),
      feedback:
        grammarScore < 6
          ? "Work on grammar accuracy and sentence structures."
          : "Grammar is mostly accurate.",
    },
  };

  const overallBand = roundToHalf(
    (criteria.taskResponse.score +
      criteria.coherence.score +
      criteria.lexical.score +
      criteria.grammar.score) /
      4
  );

  // overall feedback
  const feedbackParts = [];
  if (words < 200)
    feedbackParts.push(
      "Essays is short — try to write more (target ~250 words)."
    );
  if (lexicalScore < 6)
    feedbackParts.push("Work on vocabulary variety and collocations.");
  if (grammarScore < 6)
    feedbackParts.push("Work on grammar accuracy and sentence structures.");
  if (coherenceScore < 6)
    feedbackParts.push("Improve paragraphing and linking words.");
  if (feedbackParts.length === 0)
    feedbackParts.push("Good performance. Keep improving accuracy and range.");

  return {
    criteria,
    overallBand,
    feedback: feedbackParts.join(" "),
    raw: {
      mode: "mock",
      words,
      uniqWordsRatio: uniqWords / Math.max(1, words),
    },
  };
}

/** Call OpenAI Chat Completions to ask for strict JSON output */
async function openAiEvaluate(essay, openaiKey, model = "gpt-4o") {
  console.log("Using OpenAI model", model);
  const prompt = `You are an experienced IELTS examiner. Grade the following essay according to IELTS Writing band descriptors. 
Return valid JSON only (no preface) in the format:
{
  "criteria": {
    "taskResponse": {"score": number (0-9, can be .5), "feedback": string},
    "coherence": {"score": number, "feedback": string},
    "lexical": {"score": number, "feedback": string},
    "grammar": {"score": number, "feedback": string}
  },
  "overallBand": number (0-9, .5 increments),
  "feedback": "Concise overall feedback"
}
Essay:
"""${essay.replace(/\"\"\"/g, "'")}"""`;

  const url = "https://api.openai.com/v1/chat/completions";
  const body = {
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.0,
    max_tokens: 800,
  };
  const headers = {
    Authorization: `Bearer ${openaiKey}`,
    "Content-Type": "application/json",
  };

  const resp = await axios.post(url, body, { headers, timeout: 30000 });
  const content = resp.data?.choices?.[0]?.message?.content;
  let jsonText = content;
  if (!jsonText) throw new Error("Empty response from OpenAI");

  // strip markdown fences if present
  if (jsonText.startsWith("```")) {
    jsonText = jsonText
      .replace(/^```(?:json)?\s*/, "")
      .replace(/```$/, "")
      .trim();
  }
  try {
    const parsed = JSON.parse(jsonText);
    const c = parsed.criteria || {};
    const criteria = {
      taskResponse: {
        score: roundToHalf(Number(c.taskResponse?.score) || 0),
        feedback: c.taskResponse?.feedback || "",
      },
      coherence: {
        score: roundToHalf(Number(c.coherence?.score) || 0),
        feedback: c.coherence?.feedback || "",
      },
      lexical: {
        score: roundToHalf(Number(c.lexical?.score) || 0),
        feedback: c.lexical?.feedback || "",
      },
      grammar: {
        score: roundToHalf(Number(c.grammar?.score) || 0),
        feedback: c.grammar?.feedback || "",
      },
    };
    const overallBand = roundToHalf(
      Number(parsed.overallBand) ||
        Object.values(criteria).reduce((sum, c) => sum + c.score, 0) / 4
    );
    const feedback = parsed.feedback || "";
    return { criteria, overallBand, feedback, raw: parsed };
  } catch (err) {
    // parsing failed -> fallback to mock but include raw text
    return {
      ...mockEvaluate(essay),
      raw: { parseError: err.message, content },
    };
  }
}

/** public function */
export default async function evaluateEssay(essay, options = {}) {
  const { openaiKey, model } = options;
  if (openaiKey) {
    try {
      return await openAiEvaluate(essay, openaiKey, model);
    } catch (err) {
      console.error(
        "OpenAI evaluation failed, using mock. Error:",
        err?.message || err
      );
      return {
        ...mockEvaluate(essay),
        rawFallbackError: err?.message || String(err),
      };
    }
  } else {
    return mockEvaluate(essay);
  }
}
