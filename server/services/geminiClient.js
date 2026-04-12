const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GEMINI_API_KEY;
const FLASH_MODEL = 'gemini-2.5-flash';
const PRO_MODEL = 'gemini-2.5-pro';

let genAI = null;
function getClient() {
  if (genAI) return genAI;
  if (!API_KEY) return null;
  genAI = new GoogleGenerativeAI(API_KEY);
  return genAI;
}

// Send a message and get back text. model: 'flash' | 'pro'
// Returns null if Gemini is unreachable (caller should fall back).
async function invoke({ prompt, system, model = 'flash' }) {
  const client = getClient();
  if (!client) return null;

  const modelId = model === 'pro' ? PRO_MODEL : FLASH_MODEL;

  try {
    const m = client.getGenerativeModel({
      model: modelId,
      systemInstruction: system || undefined,
    });
    const result = await m.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error('Gemini invoke failed:', err.message);
    return null;
  }
}

// JSON helper: asks model to respond in JSON, parses the result.
async function invokeJSON({ prompt, system, model = 'flash' }) {
  const sysWithJSON = (system || '') + '\nRespond ONLY with valid JSON. No markdown fences, no explanation.';
  const text = await invoke({ prompt, system: sysWithJSON, model });
  if (!text) return null;
  try {
    const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error('Gemini JSON parse failed:', err.message);
    return null;
  }
}

module.exports = { invoke, invokeJSON };
