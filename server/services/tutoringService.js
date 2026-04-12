const gemini = require('./geminiClient');
const bedrock = require('./bedrockClient');
const File = require('../models/File');
const fs = require('fs');

const SYSTEM_PROMPT = `You are an intelligent AI tutor helping a student at Georgia State University.
Use the provided context from their study materials to answer questions accurately.
If the context doesn't contain relevant information, use your general knowledge but say so.
Give clear, concise explanations. Use examples when helpful.`;

class TutoringService {
  async answerQuestion(question, fileIds, userId) {
    try {
      let context = '';
      if (fileIds && fileIds.length > 0) {
        const files = await File.find({ _id: { $in: fileIds }, userId });
        for (const file of files) {
          if (file.transcription?.text) {
            context += `\n\nFrom ${file.originalName}:\n${file.transcription.text}`;
          } else if (file.fileType === 'text/plain' && file.localPath) {
            try { context += `\n\nFrom ${file.originalName}:\n${fs.readFileSync(file.localPath, 'utf-8')}`; } catch {}
          }
        }
      }

      const prompt = context
        ? `Context from my study materials:\n${context.slice(0, 10000)}\n\nQuestion: ${question}`
        : `Question: ${question}`;

      // 1. Try Gemini Pro (smarter, free)
      const gAnswer = await gemini.invoke({ prompt, system: SYSTEM_PROMPT, model: 'pro' });
      if (gAnswer) return gAnswer;

      // 2. Try Gemini Flash (faster, free)
      const gFlash = await gemini.invoke({ prompt, system: SYSTEM_PROMPT, model: 'flash' });
      if (gFlash) return gFlash;

      // 3. Try Bedrock Sonnet
      const bAnswer = await bedrock.invoke({
        messages: [{ role: 'user', content: prompt }],
        system: SYSTEM_PROMPT,
        model: 'sonnet',
        maxTokens: 2000,
      });
      if (bAnswer) return bAnswer;

      // 4. OpenAI fallback
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

      return 'AI tutoring is not available right now. Please check that a Gemini API key is set (GEMINI_API_KEY).';
    } catch (err) {
      console.error('Tutoring error:', err);
      throw new Error('Failed to generate answer');
    }
  }
}

module.exports = new TutoringService();
