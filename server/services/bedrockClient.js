const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const REGION = process.env.AWS_REGION || 'us-east-2';

// Haiku 4.5 for bulk tasks (flashcards, quizzes, study guides) — cheap and fast
const HAIKU = 'anthropic.claude-haiku-4-5-20251001-v1:0';
// Sonnet for the AI tutor chat — smarter, better reasoning
const SONNET = 'anthropic.claude-sonnet-4-6';

let client = null;
function getClient() {
  if (client) return client;
  client = new BedrockRuntimeClient({ region: REGION });
  return client;
}

// Send a message to a Bedrock Claude model and get back the text response.
// model: 'haiku' | 'sonnet' (defaults to haiku)
// Returns null if Bedrock is unreachable (caller should fall back).
async function invoke({ messages, system, model = 'haiku', maxTokens = 4096 }) {
  const modelId = model === 'sonnet' ? SONNET : HAIKU;

  const body = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: maxTokens,
    messages,
  };
  if (system) body.system = system;

  try {
    const cmd = new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(body),
    });

    const res = await getClient().send(cmd);
    const parsed = JSON.parse(new TextDecoder().decode(res.body));
    return parsed.content?.[0]?.text || null;
  } catch (err) {
    console.error('Bedrock invoke failed:', err.message);
    return null;
  }
}

// JSON-specific helper: asks the model to respond in JSON and parses the result.
// Returns null on failure (caller should fall back).
async function invokeJSON({ messages, system, model = 'haiku', maxTokens = 4096 }) {
  const sysWithJSON = (system || '') + '\nRespond ONLY with valid JSON. No markdown, no explanation.';
  const text = await invoke({ messages, system: sysWithJSON, model, maxTokens });
  if (!text) return null;
  try {
    // strip markdown fences if the model wrapped them
    const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error('Bedrock JSON parse failed:', err.message);
    return null;
  }
}

module.exports = { invoke, invokeJSON, HAIKU, SONNET };
