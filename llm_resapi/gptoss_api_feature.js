// To run: node resapi.js
// POST to: http://localhost:4000/chat
// Headers: Content-Type: application/json
// Body: { "text": "Your IELTS essay here" }

import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const app = express();
const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.use(express.json());


let stopwords = new Set();
try {
  const data = fs.readFileSync("stop_word.txt", "utf8");
  data.split(/\r?\n/).forEach(word => {
    if (word.trim()) stopwords.add(word.trim());
  });
  console.log(`✅ Loaded ${stopwords.size} stopwords`);
} catch (err) {
  console.error("⚠️ Could not load stop_word.txt:", err.message);
}

// === Feature Extraction ===
function extractFeatures(text) {
  const cleanText = text.replace(/[.,!?;:"()\-]/g, '');
  const tokens = cleanText.split(/\s+/).filter(Boolean);
  const tokenLower = tokens.map(word => word.toLowerCase());

  const wordCount = tokens.length;
  const sentenceCount = Math.max(text.split(/[.!?]/).filter(s => s.trim().length > 0).length, 1);
  const charCount = text.replace(/[\s.,!?;:"()\-]/g, '').length;

  const freq = {};
  tokenLower.forEach(word => freq[word] = (freq[word] || 0) + 1);
  const hapaxCount = Object.values(freq).filter(count => count === 1).length;

  const stopWordCount = tokenLower.filter(word => stopwords.has(word)).length;

  let nounCount = 0;
  for (let w of text.split(/\s+/)) {
    if (/^[A-Z]/.test(w) && !/^[A-Z]{2,}$/.test(w)) nounCount++;
  }

  const syllableCount = estimateSyllables(tokens);
  const readingEase =
    206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount);

  return {
    wordCount,
    sentenceCount,
    charCount,
    hapaxCount,
    stopWordCount,
    nounCount,
    syllableCount,
    readingEase: readingEase.toFixed(2)
  };
}

function estimateSyllables(words) {
  let total = 0;
  for (let word of words) {
    word = word.toLowerCase()
      .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
      .replace(/^y/, '');
    const syllables = word.match(/[aeiouy]{1,2}/g);
    total += syllables ? syllables.length : 1;
  }
  return total;
}

function extractJson(text) {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    const jsonString = text.slice(start, end + 1);
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("❌ Failed to parse JSON:", e.message);
    return null;
  }
}

function getReadabilityLevel(score) {
  if (score >= 90) return "Very Easy";
  if (score >= 80) return "Easy";
  if (score >= 70) return "Fairly Easy";
  if (score >= 60) return "Standard";
  if (score >= 50) return "Fairly Difficult";
  if (score >= 30) return "Difficult";
  return "Very Difficult";
}

app.post('/chat', async (req, res) => {
  try {
    const topicEssat = req.body.name;
    const userEssay = req.body.text;
    if (!userEssay || typeof userEssay !== 'string') {
      return res.status(400).json({ error: 'Invalid input. Provide essay text in "text".' });
    }
    if (!topicEssat || typeof topicEssat !== 'string') {
      return res.status(400).json({ error: 'Invalid input. Provide essay name in "name".' });
    }

    const features = extractFeatures(userEssay);
    const featureSection = `
### Linguistic Analysis & Performance Indicators

**Core Metrics:**  
- Word Count: ${features.wordCount}  
- Sentence Count: ${features.sentenceCount}  
- Avg Sentence Length: ${Math.round(features.wordCount / features.sentenceCount)} words  

**Lexical Sophistication:**  
- Vocabulary Diversity: ${features.hapaxCount} unique words (${Math.round((features.hapaxCount / features.wordCount) * 100)}%)  
- Content Word Density: ${features.wordCount - features.stopWordCount} content vs ${features.stopWordCount} function words  
- Proper Noun Usage: ${features.nounCount}  

**Readability & Style:**  
- Syllabic Complexity: ${features.syllableCount} syllables  
- Flesch Reading Ease: ${features.readingEase}/100 (${getReadabilityLevel(features.readingEase)})  
- Character Density: ${features.charCount} characters  
`;

    const evaluationPrompt = `
You are an experienced IELTS Writing Task 2 examiner following official IELTS band descriptors. Evaluate this essay using the four assessment criteria below.

ASSESSMENT CRITERIA:
(Task Response, Coherence and Cohesion, Lexical Resource, Grammatical Range and Accuracy)

EVALUATION INSTRUCTIONS:
1. Read the essay carefully and assess each criterion independently.
2. For each criterion, assign a band score from 1-9 (whole numbers only).
3. Provide specific, evidence-based reasoning (2-3 sentences) citing examples from the essay.
4. Calculate the overall score as the average of four scores, rounded to nearest 0.5.
5. Write constructive feedback highlighting key strengths and areas for improvement.

RESPONSE FORMAT:
Return your evaluation in this exact JSON structure (no additional text):

{
  "taskResponse": { 
    "score": <1-9>, 
    "reasoning": "<specific evidence-based explanation citing essay examples>" 
  },
  "coherenceCohesion": { 
    "score": <1-9>, 
    "reasoning": "<specific evidence-based explanation citing essay examples>" 
  },
  "lexicalResource": { 
    "score": <1-9>, 
    "reasoning": "<specific evidence-based explanation citing essay examples>" 
  },
  "grammaticalRange": { 
    "score": <1-9>, 
    "reasoning": "<specific evidence-based explanation citing essay examples>" 
  },
  "overall": <average rounded to nearest 0.5>,
  "feedback": "<2-3 sentences summarizing key strengths and priority areas for improvement>"
}

${featureSection}

ESSAY TO EVALUATE:
Topic "${topicEssat}"
"""${userEssay}"""
`.trim();

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          {
            role: "system",
            content: "You are an expert IELTS Writing Task 2 examiner. Output ONLY JSON in the exact schema provided."
          },
          { role: "user", content: evaluationPrompt }
        ],
        temperature: 0.3,
        max_tokens: 3000
      })
    });

    const data = await groqResponse.json();
    console.log("👉 Groq API raw response:", JSON.stringify(data, null, 2));

    if (data.error) {
      return res.status(500).json({ error: 'Groq API Error', detail: data.error.message });
    }

    const fullText = data.choices?.[0]?.message?.content || '';
    const parsedScores = extractJson(fullText);

    if (!parsedScores) {
      return res.status(500).json({ error: 'Failed to parse evaluation results', rawResponse: fullText });
    }

    res.status(200).json({ success: true,features:features,scores: parsedScores, metadata: { model: "openai/gpt-oss-20b" } });

  } catch (err) {
    res.status(500).json({ error: 'Server Error', detail: err.message });
  }
});

app.post('/features', (req, res) => {
  const userEssay = req.body.text;
  if (!userEssay || typeof userEssay !== 'string') {
    return res.status(400).json({ error: 'Invalid input. Provide essay text in "text".' });
  }
  const features = extractFeatures(userEssay);
  res.status(200).json({ success: true, features });
});

app.get('/', (req, res) => {
  res.send('🎉 API is running: Enhanced IELTS Essay Evaluation Server');
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`✅ Enhanced IELTS Essay Evaluation API running at http://localhost:${PORT}`);
});
