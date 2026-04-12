const gemini = require('./geminiClient');
const bedrock = require('./bedrockClient');

async function generate({ text, topic, count = 10 }) {
  const prompt = [
    `Create exactly ${count} flashcards from the following text.`,
    topic ? `The topic is: ${topic}.` : '',
    'Each flashcard should have a clear question and a concise answer.',
    'Return JSON: {"cards":[{"question":"...","answer":"..."}]}',
    '',
    text.slice(0, 8000)
  ].join('\n');

  const system = 'You are a study assistant that creates flashcards from academic material. Always respond with valid JSON.';

  // 1. Try Gemini (free)
  const gResult = await gemini.invokeJSON({ prompt, system });
  if (gResult?.cards && Array.isArray(gResult.cards)) {
    return gResult.cards.filter(c => c.question && c.answer).slice(0, count);
  }

  // 2. Try Bedrock
  const bResult = await bedrock.invokeJSON({
    messages: [{ role: 'user', content: prompt }],
    system,
    model: 'haiku',
  });
  if (bResult?.cards && Array.isArray(bResult.cards)) {
    return bResult.cards.filter(c => c.question && c.answer).slice(0, count);
  }

  // 3. Try OpenAI
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

  // 4. Naive fallback
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
