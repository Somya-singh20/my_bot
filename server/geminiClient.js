const axios = require('axios');

let googleClient = null;
if (process.env.GEMINI_PROVIDER === 'google') {
  try {
    const { GoogleGenAI } = require('@google/genai');
    // Pass apiKey if provided; the library may also use ADC.
    googleClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  } catch (e) {
    console.warn('Could not load @google/genai - make sure it is installed in server/', e.message);
  }
}

async function generate(messages) {
  // messages: [{role, content}, ...]
  const conversationText = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');

  const formattingInstruction = `Respond ONLY with valid JSON matching this schema:\n{\n  "title": string,\n  "summary": string,\n  "sections": [{ "heading": string, "content": string }],\n  "examples": [{ "input": string, "output": string }],\n  "notes": string | null\n}\nUse Markdown inside summary and section content. If you cannot answer, return empty fields. Do not include any additional commentary.`;

  function tryParseStructured(text) {
    if (!text || typeof text !== 'string') return null;
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first === -1 || last === -1) return null;
    const maybe = text.slice(first, last + 1);
    try {
      const parsed = JSON.parse(maybe);
      if (parsed && typeof parsed === 'object' && 'sections' in parsed) return parsed;
    } catch (e) {
      return null;
    }
    return null;
  }

  function structuredToMarkdown(obj) {
    if (!obj) return null;
    let md = '';
    if (obj.title) md += `# ${obj.title}\n\n`;
    if (obj.summary) md += `${obj.summary}\n\n`;
    if (Array.isArray(obj.sections)) {
      for (const s of obj.sections) {
        if (s.heading) md += `## ${s.heading}\n\n`;
        if (s.content) md += `${s.content}\n\n`;
      }
    }
    if (Array.isArray(obj.examples) && obj.examples.length) {
      md += `## Examples\n\n`;
      for (const ex of obj.examples) {
        md += `**Input:**\n\n\`\`\`\n${ex.input}\n\`\`\`\n\n`;
        md += `**Output:**\n\n\`\`\`\n${ex.output}\n\`\`\`\n\n`;
      }
    }
    if (obj.notes) md += `> ${obj.notes}\n\n`;
    return md.trim();
  }

  // Google GenAI path
  // If no provider and no API URL is configured, return a mock structured reply
  if (!process.env.GEMINI_PROVIDER && !process.env.GEMINI_API_URL) {
    const lastUser = messages.slice().reverse().find(m => m.role === 'user')
    const userText = lastUser ? lastUser.content : 'Hello'
    const mock = {
      title: 'Mock reply',
      summary: `This is a mock structured reply for: ${userText}`,
      sections: [
        { heading: 'Overview', content: 'This is a simulated answer used for development when no API key is set.' },
        { heading: 'Answer', content: `**You asked:** ${userText}\n\n**Short answer:** This is a mock response.` }
      ],
      examples: [],
      notes: 'Set GEMINI_PROVIDER or GEMINI_API_URL to use a real model.'
    }
    return { text: structuredToMarkdown(mock), raw: mock }
  }
  if (process.env.GEMINI_PROVIDER === 'google' && googleClient) {
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const contents = [formattingInstruction, conversationText];
    const resp = await googleClient.models.generateContent({ model, contents });
    const text = resp?.text || (resp?.output && resp.output[0]) || JSON.stringify(resp);
    const parsed = tryParseStructured(text) || tryParseStructured(JSON.stringify(resp));
    if (parsed) return { text: structuredToMarkdown(parsed) || text, raw: parsed };
    return { text, raw: resp };
  }

  // Fallback HTTP provider path
  if (!process.env.GEMINI_API_URL) throw new Error('GEMINI_API_URL not configured');
  const prompt = formattingInstruction + '\n\n' + conversationText;
  const payload = { prompt, max_tokens: 512 };
  const response = await axios.post(process.env.GEMINI_API_URL, payload, {
    headers: {
      'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    timeout: 120000
  });

  const raw = response.data;
  const rawText = typeof raw === 'string' ? raw : JSON.stringify(raw);
  const parsed = tryParseStructured(rawText) || (typeof raw === 'object' ? tryParseStructured(JSON.stringify(raw)) : null);
  if (parsed) return { text: structuredToMarkdown(parsed) || rawText, raw: parsed };
  const fallbackText = raw?.reply || raw?.text || rawText;
  return { text: fallbackText, raw };
}

module.exports = { generate };
