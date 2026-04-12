const gemini = require('./geminiClient');
const bedrock = require('./bedrockClient');
const { extractFromFiles } = require('./fileExtractor');

const SYSTEM_PROMPT = `You are an intelligent AI tutor helping a student at Georgia State University.

IMPORTANT RULES:
- ONLY reference documents that appear in the "Context from my study materials" section below.
- DO NOT make up or hallucinate file names, page numbers, or citations.
- If context is provided, base your answer on it and reference it by the exact filename shown (e.g. "From sineshawtesfaye_Group10_Sprint3.pdf").
- If no context is provided or the context doesn't answer the question, say "Based on my general knowledge:" and then answer. Do NOT pretend to cite a document.
- Give clear, concise explanations with examples when helpful.`;

class TutoringService {
  async answerQuestion(question, fileIds, userId) {
    try {
      // Pull actual text from the user's files (S3 + PDF parsing)
      const context = await extractFromFiles(fileIds, userId);

      let prompt;
      if (context && context.trim().length > 50) {
        prompt = `Context from my study materials:\n${context.slice(0, 12000)}\n\nQuestion: ${question}`;
      } else if (fileIds && fileIds.length > 0) {
        // Files were selected but extraction failed
        prompt = `Note: The student selected files but text extraction was not possible (the files may be scanned images or unsupported format). Answer the following question from general knowledge and clearly state you could not read the files.\n\nQuestion: ${question}`;
      } else {
        prompt = `No study materials were provided. Answer from general knowledge and clearly state that.\n\nQuestion: ${question}`;
      }

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
