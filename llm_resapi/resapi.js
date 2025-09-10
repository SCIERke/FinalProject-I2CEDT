
//To use in postman run "node resapi.js"
//POST  http://localhost:3000/chat
//Header Content-Type:application/json
//Body  {"text": ......}

//Response format 
// //{
//    "success": true,
//    "scores": {
//        "taskResponse": 7,
//        "coherenceCohesion": 7,
//        "lexicalResource": 7,
 //       "grammaticalRange": 7,
 //       "overall": 7,
 //       "feedback":...
 //   }
//}
import express from 'express';
import fetch from 'node-fetch';

const app = express();
const GEMINI_API_KEY = "AIzaSyA6kJSlSNFPAFxPNvlYwknVLgLIFiACfXA";

app.use(express.json());

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

app.post('/chat', async (req, res) => {
  try {
    const userEssay = req.body.text;
    if (!userEssay || typeof userEssay !== 'string') {
      return res.status(400).json({ error: 'Invalid input. Please provide essay text in "text" field.' });
    }

    // Structured prompt
    const prompt = `
You are an IELTS Writing Task 2 examiner. Assess the candidate’s essay using the four IELTS band score criteria:

1. Task Response  
2. Coherence and Cohesion  
3. Lexical Resource  
4. Grammatical Range and Accuracy

Please return your evaluation in the following **strict JSON format**, without any explanation outside the structure:

{
  "taskResponse": <score out of 9>,
  "coherenceCohesion": <score out of 9>,
  "lexicalResource": <score out of 9>,
  "grammaticalRange": <score out of 9>,
  "overall": <average score>,
  "feedback": "<concise but detailed feedback about strengths and areas for improvement>"
}

Here is the essay:

"""${userEssay}"""
    `.trim();

    // Request to Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    const data = await response.json();
    const fullText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsedScores = extractJson(fullText);

    res.status(200).json({
      success: true,
      scores: parsedScores,
      rawText: fullText
    });

  } catch (err) {
    console.error("🔥 Server Error:", err);
    res.status(500).json({ error: 'Failed to connect to Gemini API', detail: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ IELTS Essay Evaluation API running at http://localhost:${PORT}`);
});
