const OpenAI = require('openai');

let client = null;
function getClient() {
  if (client) return client;
  if (!process.env.OPENAI_API_KEY) return null;
  client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

// Generate flashcards from a chunk of text. If no OpenAI key is set we fall
// back to a naive splitter so tests and local dev still work.
async function generate({ text, topic, count = 10 }) {
  const ai = getClient();
  if (!ai) return naiveCards(text, count);

  const prompt = [
    `Create ${count} flashcards from the following text.`,
    topic ? `Topic: ${topic}.` : '',
    'Respond as JSON: {"cards":[{"question":"...","answer":"..."}]}',
    '',
    text.slice(0, 8000)
  ].join('\n');

  const res = await ai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }
  });

  try {
    const parsed = JSON.parse(res.choices[0].message.content);
    if (!Array.isArray(parsed.cards)) throw new Error('bad shape');
    return parsed.cards.filter(c => c.question && c.answer);
  } catch (e) {
    console.error('flashcard parse failed:', e.message);
    return naiveCards(text, count);
  }
}

function naiveCards(text, count) {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 20);
  return sentences.slice(0, count).map((s, i) => ({
    question: `Term ${i + 1}: what does this describe? "${s.slice(0, 80)}..."`,
    answer: s.trim()
  }));
}

module.exports = { generate };
