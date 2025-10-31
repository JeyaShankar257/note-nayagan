import express from 'express';
import fetch from 'node-fetch';
// import { GoogleTranslator } from 'deep-translator';
import cors from 'cors';


const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = "AIzaSyDMZLoPjtIt7DWMKNvIxNZE90yihzWCSGo";

// In-memory cache: { '<text>::<lang>': 'translated text' }
const translationCache = {};

// Simple request queue for batching/limiting
const requestQueue = [];
let processingQueue = false;
const QUEUE_DELAY_MS = 500; // 0.5s between requests (adjust as needed)

function enqueueTranslationJob(job) {
  requestQueue.push(job);
  processQueue();
}

async function processQueue() {
  if (processingQueue) return;
  processingQueue = true;
  while (requestQueue.length > 0) {
    const job = requestQueue.shift();
    await job();
    await new Promise((res) => setTimeout(res, QUEUE_DELAY_MS));
  }
  processingQueue = false;
}
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

app.post('/api/translate', async (req, res) => {
  const { text, targetLang } = req.body;
  console.log("Received body:", req.body);
  const cacheKey = `${text}::${targetLang}`;
  if (translationCache[cacheKey]) {
    console.log(`[CACHE HIT] ${cacheKey}`);
    return res.json({ translatedText: translationCache[cacheKey] });
  }
  console.log(`[QUEUE] Adding translation job for: '${text}' to '${targetLang}'`);
  enqueueTranslationJob(async () => {
    try {
      console.log(`[PYTHON REQUEST] Sending to microservice:`, { text, targetLang });
      const pyRes = await fetch('http://127.0.0.1:5001/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang })
      });
      console.log(`[PYTHON RESPONSE] Status: ${pyRes.status}`);
      if (!pyRes.ok) {
        const errData = await pyRes.json().catch(() => ({}));
        console.error('[PYTHON ERROR]', errData);
        throw new Error(errData.error || 'Python translation service failed');
      }
      const data = await pyRes.json();
      console.log(`[PYTHON RESPONSE DATA]`, data);
      const translatedText = data.translatedText || '';
      translationCache[cacheKey] = translatedText;
      res.json({ translatedText });
    } catch (err) {
      console.error("Translation error:", err);
      res.status(500).json({ error: "Translation failed" });
    }
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Translation API server running on port ${PORT}`);
});

// Gemini Chatbot endpoint for note-specific chat (moved here after app is defined)
app.post('/api/gemini-chat', async (req, res) => {
  console.log("/api/gemini-chat received body:", req.body);
  const { messages, noteId } = req.body;
  if (
    !messages ||
    !Array.isArray(messages) ||
    messages.length < 2 ||
    messages[0].role !== 'system' ||
    messages[1].role !== 'user' ||
    messages[messages.length - 1].role !== 'user'
  ) {
    return res.status(400).json({ error: 'Missing or invalid messages. Must start with system, then user, and end with user.' });
  }
  try {
    // Convert messages to Gemini API format
    // Only allow 'user' and 'model' roles for Gemini
    // Convert 'assistant' -> 'model', ignore 'system'
    const geminiMessages = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
    // Optionally, prepend a system prompt as a 'user' message if present
    const systemMsg = messages.find(m => m.role === 'system');
    const contents = systemMsg
      ? [{ role: 'user', parts: [{ text: systemMsg.content }] }, ...geminiMessages]
      : geminiMessages;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      }
    );
    const geminiData = await geminiRes.json();
    console.log('Gemini API status:', geminiRes.status);
    console.log('Gemini API response:', JSON.stringify(geminiData, null, 2));
    if (!geminiRes.ok) {
      return res.status(geminiRes.status).json({ error: geminiData.error || 'Chat failed' });
    }
    const reply =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';
    res.json({ reply });
  } catch (err) {
    console.error('Gemini chat error:', err);
    res.status(500).json({ error: 'Chat failed', details: err.message });
  }
});
