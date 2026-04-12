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

      const userMsg = context
        ? `Context from my study materials:\n${context.slice(0, 10000)}\n\nQuestion: ${question}`
        : `Question: ${question}`;

      // Try Bedrock Sonnet (smarter model for tutoring)
      const answer = await bedrock.invoke({
        messages: [{ role: 'user', content: userMsg }],
        system: SYSTEM_PROMPT,
        model: 'sonnet',
        maxTokens: 2000,
      });
      if (answer) return answer;

      // OpenAI fallback
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key') {
        const { OpenAI } = require('openai');
        const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const res = await ai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userMsg }
          ],
          max_tokens: 1000
        });
        return res.choices[0].message.content;
      }

      return 'AI tutoring is not available right now. Please check that Bedrock model access is enabled in your AWS account, or set an OpenAI API key.';
    } catch (err) {
      console.error('Tutoring error:', err);
      throw new Error('Failed to generate answer');
    }
  }
}

module.exports = new TutoringService();
