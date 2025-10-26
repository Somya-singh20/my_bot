const axios = require('axios');

let googleClient = null;
if (process.env.GEMINI_PROVIDER === 'google') {
  try {
    const { GoogleGenAI } = require('@google/genai');
    // If the package accepts an apiKey option, pass it. Otherwise it may
    // rely on application default credentials; consult package docs.
    googleClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  } catch (e) {
    console.warn('Could not load @google/genai - make sure it is installed in server/', e.message);
  }
}

async function generate(messages) {
  // messages: [{role, content}, ...]
  if (process.env.GEMINI_PROVIDER === 'google' && googleClient) {
    // The Google GenAI client example expects a `contents` string or array.
    const contents = messages.map(m => m.content).join('\n');
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    const resp = await googleClient.models.generateContent({
      model,
      contents
    });

    // Normalize response to an object with a `text` field and raw `raw`.
    return { text: resp?.text || (resp?.output && resp.output[0]) || JSON.stringify(resp), raw: resp };
  }

  // Fallback: post directly to GEMINI_API_URL using axios
  if (!process.env.GEMINI_API_URL) throw new Error('GEMINI_API_URL not configured');

  const payload = {
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    max_tokens: 512
  };

  const response = await axios.post(process.env.GEMINI_API_URL, payload, {
    headers: {
      'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    timeout: 120000
  });

  return { text: response.data?.reply || response.data, raw: response.data };
}

module.exports = { generate };
