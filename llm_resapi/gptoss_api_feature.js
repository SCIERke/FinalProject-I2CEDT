// To run: node resapi.js
// POST to: http://localhost:3000/chat
// Headers: Content-Type: application/json
// Body: { "text": "Your IELTS essay here" }

import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const GROQ_API_KEY = process.env.GROQ_API_KEYs; // Replace with your Groq API key

app.use(express.json());

// === NLP Feature Extraction Function ===
function extractFeatures(text) {
const stopwords = new Set(["a", "about", "above", "after", "again", "against", "all", "almost", "alone", "along", "also", "although", "always", "among", "an", "and", "any", "are", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "could", "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from", "further", "had", "has", "have", "having", "he", "her", "here", "hers", "him", "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just", "me", "more", "most", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "our", "ours", "ourselves", "out", "over", "own", "same", "she", "should", "so", "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves", "then", "there", "these", "they", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why", "with", "would", "you", "your", "yours", "yourself", "yourselves"]);


const cleanText = text.replace(/[.,!?;:"()\-]/g, '');
const tokens = cleanText.split(/\s+/).filter(Boolean);
const tokenLower = tokens.map(word => word.toLowerCase());


const wordCount = tokens.length;
const sentenceCount = text.split(/[.!?]/).filter(s => s.trim().length > 0).length;
const charCount = text.replace(/[\s.,!?;:"()\-]/g, '').length;


const freq = {};
tokenLower.forEach(word => {
freq[word] = (freq[word] || 0) + 1;
});
const hapaxCount = Object.values(freq).filter(count => count === 1).length;


const stopWordCount = tokenLower.filter(word => stopwords.has(word)).length;


const words = text.split(/\s+/);
let nounCount = 0;
for (let i = 1; i < words.length; i++) {
const w = words[i];
if (/^[A-Z]/.test(w) && !/^[A-Z]{2,}$/.test(w)) {
nounCount++;
}
}


const syllableCount = estimateSyllables(tokens);
const readingEase = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount);



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
word = word.toLowerCase().replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
const syllables = word.match(/[aeiouy]{1,2}/g);
total += syllables ? syllables.length : 1;
}
return total;
}


// Helper to extract JSON from model output
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
    return "Very Difficult";}




app.post('/chat', async (req, res) => {
  try {
    const userEssay = req.body.text;

    if (!userEssay || typeof userEssay !== 'string') {
      return res.status(400).json({ error: 'Invalid input. Please provide essay text in "text" field.' });
    }
    const features = extractFeatures(userEssay);
    const featureSection = `
    ### Linguistic Analysis & Performance Indicators

    Research indicates strong correlations between specific linguistic features and essay quality. Consider these metrics when evaluating the essay's sophistication and effectiveness:

    **Core Metrics:**
    - **Word Count:** ${features.wordCount} (optimal range varies by assignment type)
    - **Sentence Count:** ${features.sentenceCount} (indicates structural complexity)
    - **Average Sentence Length:** ${Math.round(features.wordCount / features.sentenceCount)} words

    **Lexical Sophistication:**
    - **Vocabulary Diversity:** ${features.hapaxCount} unique words (${Math.round((features.hapaxCount / features.wordCount) * 100)}% of total)
    - **Content Word Density:** ${features.wordCount - features.stopWordCount} content words vs ${features.stopWordCount} function words
    - **Proper Noun Usage:** ${features.nounCount} (indicates specificity and concrete examples)

    **Readability & Style:**
    - **Syllabic Complexity:** ${features.syllableCount} total syllables (avg: ${(features.syllableCount / features.wordCount).toFixed(1)} per word)
    - **Flesch Reading Ease:** ${features.readingEase}/100  Level : (${getReadabilityLevel(features.readingEase)}) *Higher scores = easier to read; Academic writing typically ranges 30-50*
    - **Character Density:** ${features.charCount} characters (avg: ${(features.charCount / features.wordCount).toFixed(1)} per word)

    **Scoring Guidance:**
    Use these features to assess:
    • **Sophistication:** Higher hapax legomena and syllable complexity suggest advanced vocabulary
    • **Clarity:** Balanced reading ease scores (30-70) often indicate appropriate academic complexity
    • **Development:** Word count and proper noun usage reflect depth of content
    • **Structure:** Sentence count and average length indicate organizational maturity

    Note: These metrics complement, but don't replace, qualitative assessment of content, argumentation, and coherence.`;



    // Refined IELTS scoring criteria
    const criteria = [
      {
        name: "Task Response",
        key: "taskResponse",
        definition: "Evaluates how well the candidate addresses all parts of the task with a clear position throughout, presents fully extended and well-supported ideas, and stays relevant to the topic.",
        bandGuidelines: {
          "9": "Fully addresses all parts with clear, fully developed position and highly relevant ideas",
          "7-8": "Addresses task with clear position and relevant, well-developed ideas",
          "5-6": "Addresses task but position may be unclear, ideas partially developed",
          "3-4": "Attempts to address task but position unclear, limited idea development",
          "1-2": "Minimal attempt to address task, no clear position"
        }
      },
      {
        name: "Coherence and Cohesion",
        key: "coherenceCohesion",
        definition: "Assesses logical organization of information and ideas, skillful use of cohesive devices (linking words, pronouns, conjunctions), clear progression throughout, and appropriate paragraphing.",
        bandGuidelines: {
          "9": "Uses cohesion naturally with wide range of devices, logical sequencing",
          "7-8": "Logical organization with clear progression, good use of cohesive devices",
          "5-6": "Information organized but progression not always clear, some cohesive devices",
          "3-4": "Basic organization present but limited cohesive devices",
          "1-2": "Little evidence of organization or cohesive devices"
        }
      },
      {
        name: "Lexical Resource",
        key: "lexicalResource",
        definition: "Measures vocabulary range, precision of word choice, natural and appropriate usage, awareness of style and collocation, and minimal errors that don't impede communication.",
        bandGuidelines: {
          "9": "Wide range used naturally with sophisticated control and rare errors",
          "7-8": "Good range with natural usage and occasional errors",
          "5-6": "Adequate range but some inappropriate usage and errors",
          "3-4": "Limited range with frequent errors affecting meaning",
          "1-2": "Very limited range with errors that severely impede communication"
        }
      },
      {
        name: "Grammatical Range and Accuracy",
        key: "grammaticalRange",
        definition: "Evaluates variety of sentence structures, grammatical accuracy and control, appropriate punctuation, and how errors affect communication clarity.",
        bandGuidelines: {
          "9": "Wide range of structures with full flexibility and rare errors",
          "7-8": "Good range with majority error-free sentences",
          "5-6": "Mix of simple and complex structures with some errors",
          "3-4": "Limited range, frequent errors that may impede communication",
          "1-2": "Very limited range with errors that severely impede communication"
        }
      }
    ];

    // Create evaluation prompt
    const evaluationPrompt = `
You are an experienced IELTS Writing Task 2 examiner following official IELTS band descriptors. Evaluate this essay using the four assessment criteria below.

ASSESSMENT CRITERIA:

${criteria.map(c => `
**${c.name}**
${c.definition}

Key Band Levels:
${Object.entries(c.bandGuidelines).map(([band, desc]) => `• Band ${band}: ${desc}`).join('\n')}
`).join('\n')}

EVALUATION INSTRUCTIONS:
1. Read the essay carefully and assess each criterion independently
2. For each criterion, assign a band score from 1-9 (whole numbers only)
3. Provide specific, evidence-based reasoning (2-3 sentences) citing examples from the essay
4. Calculate the overall score as the average of four scores, rounded to nearest 0.5
5. Write constructive feedback highlighting key strengths and areas for improvement

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

"""${userEssay}"""
    `.trim();

    // Call Groq API
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
            content: "You are an expert IELTS Writing Task 2 examiner with extensive experience in applying official IELTS band descriptors. Provide accurate, consistent, and evidence-based evaluations."
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
      console.error("❌ Groq API Error:", data.error.message);
      return res.status(500).json({ error: 'Groq API Error', detail: data.error.message });
    }

    const fullText = data.choices?.[0]?.message?.content || '';
    const parsedScores = extractJson(fullText);

    if (!parsedScores) {
      console.warn("⚠️ JSON not found or failed to parse. Response:", fullText);
      return res.status(500).json({
        error: 'Failed to parse evaluation results',
        rawResponse: fullText
      });
    }

    // For-loop: process each criterion
    const criteriaLabels = {
      taskResponse: "Task Response",
      coherenceCohesion: "Coherence and Cohesion",
      lexicalResource: "Lexical Resource",
      grammaticalRange: "Grammatical Range and Accuracy"
    };



    res.status(200).json({
      success: true,
      scores: parsedScores,
     
      metadata: {
        model: "openai/gpt-oss-20b"
        
        
      }
    });

  } catch (err) {
    console.error("🔥 Server Error:", err);
    res.status(500).json({ error: 'Server Error', detail: err.message });
  }
});

app.post('/features', (req, res) => {
  const userEssay = req.body.text;

  if (!userEssay || typeof userEssay !== 'string') {
    return res.status(400).json({ error: 'Invalid input. Please provide essay text in "text" field.' });
  }

  const features = extractFeatures(userEssay);

  res.status(200).json({
    success: true,
    features
  });
});
const PORT = 3999;
app.listen(PORT, () => {
  console.log(`✅ Enhanced IELTS Essay Evaluation API running at http://localhost:${PORT}`);
});
