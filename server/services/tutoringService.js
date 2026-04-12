const gemini = require('./geminiClient');
const bedrock = require('./bedrockClient');
const { extractFromFiles } = require('./fileExtractor');

const SYSTEM_PROMPT = `You are an intelligent AI tutor helping a student at Georgia State University.
Use the provided context from their study materials to answer questions accurately.
When referencing the material, cite which document the info came from.
If the context doesn't contain relevant information, use your general knowledge but say so.
Give clear, concise explanations. Use examples when helpful.`;

class TutoringService {
  async answerQuestion(question, fileIds, userId) {
    try {
      // Pull actual text from the user's files (S3 + PDF parsing)
      const context = await extractFromFiles(fileIds, userId);

      const prompt = context
        ? `Context from my study materials:\n${context.slice(0, 12000)}\n\nQuestion: ${question}`
        : `Question: ${question}`;

      // 1. Try Gemini Flash (free, generous quota)
      const gAnswer = await gemini.invoke({ prompt, system: SYSTEM_PROMPT, model: 'flash' });
      if (gAnswer) return gAnswer;

      // 2. Try Bedrock Sonnet
      const bAnswer = await bedrock.invoke({
        messages: [{ role: 'user', content: prompt }],
        system: SYSTEM_PROMPT,
        model: 'sonnet',
        maxTokens: 2000,
      });
      if (bAnswer) return bAnswer;

      // 3. OpenAI fallback
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key') {
        const { OpenAI } = require('openai');
        const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const res = await ai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1000
        });
        return res.choices[0].message.content;
      }

      return 'AI tutoring is not available right now. Please check that GEMINI_API_KEY is set.';
    } catch (err) {
      console.error('Tutoring error:', err);
      throw new Error('Failed to generate answer');
    }
  }
}

module.exports = new TutoringService();
