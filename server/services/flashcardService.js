const bedrock = require('./bedrockClient');

async function generate({ text, topic, count = 10 }) {
  // Try Bedrock first
  const prompt = [
    `Create exactly ${count} flashcards from the following text.`,
    topic ? `The topic is: ${topic}.` : '',
    'Each flashcard should have a clear question and a concise answer.',
    'Return JSON: {"cards":[{"question":"...","answer":"..."}]}',
    '',
    text.slice(0, 8000)
  ].join('\n');

  const result = await bedrock.invokeJSON({
    messages: [{ role: 'user', content: prompt }],
    system: 'You are a study assistant that creates flashcards from academic material. Always respond with valid JSON.',
    model: 'haiku',
    maxTokens: 4096,
  });

  if (result?.cards && Array.isArray(result.cards)) {
    return result.cards.filter(c => c.question && c.answer).slice(0, count);
  }

  // Try OpenAI as second fallback
  try {
    if (process.env.OPENAI_API_KEY) {
      const OpenAI = require('openai');
      const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const res = await ai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });
      const parsed = JSON.parse(res.choices[0].message.content);
      if (Array.isArray(parsed.cards)) {
        return parsed.cards.filter(c => c.question && c.answer).slice(0, count);
      }
    }
  } catch (e) {
    console.error('OpenAI fallback failed:', e.message);
  }

  // Final fallback: naive sentence splitter
  return naiveCards(text, count);
}

function naiveCards(text, count) {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 20);
  return sentences.slice(0, count).map((s, i) => ({
    question: `Term ${i + 1}: what does this describe? "${s.slice(0, 80)}..."`,
    answer: s.trim()
  }));
}

module.exports = { generate };
