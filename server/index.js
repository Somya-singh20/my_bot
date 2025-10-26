require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { generate } = require('./geminiClient');

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_URL = process.env.GEMINI_API_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_URL) {
  console.warn('GEMINI_API_URL not set. Set it in server/.env');
}
if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY not set. Set it in server/.env');
}

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body; // expect array of messages {role, content}
  if (!messages) return res.status(400).json({ error: 'messages required' });
  try {
    // Use the geminiClient to generate a reply. That module handles
    // provider-specific behavior (Google GenAI client or direct axios call).
    const result = await generate(messages);
    // Normalize output: return `reply` for frontend expectation and include raw.
    return res.json({ reply: result.text, raw: result.raw });
  } catch (err) {
    console.error('LLM request failed', err?.response?.data || err.message);
    // Provide limited error details to the client. Full details are logged on the server.
    res.status(500).json({ error: 'LLM request failed', details: err?.response?.data?.error || err.message });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));

// Streaming endpoint: returns chunked text so client can render tokens as they arrive.
app.post('/api/chat/stream', async (req, res) => {
  const { messages } = req.body;
  if (!messages) return res.status(400).json({ error: 'messages required' });

  // Set headers for streaming chunked response
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');

  try {
    // Use the geminiClient to get the full generated text (provider-specific)
    const result = await generate(messages);
    const text = (result && result.text) ? String(result.text) : '';

    // If no text, end stream
    if (!text) {
      res.write('');
      return res.end();
    }

    // Simple chunking strategy: split into words and emit small groups
    const words = text.split(/(\s+)/);
    let buffer = '';
    for (let i = 0; i < words.length; i++) {
      buffer += words[i];
      // send every ~40-80 characters or when whitespace encountered
      if (buffer.length > 60 || /\s/.test(words[i])) {
        res.write(buffer);
        buffer = '';
        // small pause to simulate streaming
        await new Promise(r => setTimeout(r, 60));
      }
    }
    if (buffer.length) res.write(buffer);
    // signal end
    res.end();
  } catch (err) {
    console.error('Stream generation failed', err?.response?.data || err.message);
    // Try to send an error message chunk
    try { res.write('\n[error]\n'); res.end(); } catch (e) { /* ignore */ }
  }
});
