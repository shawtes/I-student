const gemini = require('./geminiClient');
const bedrock = require('./bedrockClient');
const File = require('../models/File');
const fs = require('fs');

class StudyService {
  async generateContent(type, title, fileIds, userId, topic) {
    try {
      let context = '';
      if (fileIds && fileIds.length > 0) {
        const files = await File.find({ _id: { $in: fileIds }, userId });
        for (const file of files) {
          if (file.transcription?.text) context += '\n\n' + file.transcription.text;
          else if (file.fileType === 'text/plain' && file.localPath) {
            try { context += '\n\n' + fs.readFileSync(file.localPath, 'utf-8'); } catch {}
          }
        }
      }

      const prompt = this.getPrompt(type, topic, context);
      const system = 'You are an expert educational content creator.';

      // Structured content (quiz/flashcard) needs JSON
      if (type === 'quiz' || type === 'flashcard') {
        const gResult = await gemini.invokeJSON({ prompt, system: system + ' Always respond with valid JSON.' });
        if (gResult) return gResult;

        const bResult = await bedrock.invokeJSON({
          messages: [{ role: 'user', content: prompt }],
          system: system + ' Always respond with valid JSON.',
          model: 'haiku',
        });
        if (bResult) return bResult;
      } else {
        // Study guide — plain text/markdown
        const gText = await gemini.invoke({ prompt, system: system + ' Use markdown formatting.' });
        if (gText) return { text: gText };

        const bText = await bedrock.invoke({
          messages: [{ role: 'user', content: prompt }],
          system: system + ' Use markdown formatting.',
          model: 'haiku',
        });
        if (bText) return { text: bText };
      }

      // OpenAI fallback
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key') {
        return await this.openAIFallback(type, prompt);
      }

      return this.getMock(type, topic);
    } catch (err) {
      console.error('Content generation error:', err);
      throw new Error('Failed to generate study content');
    }
  }

  getPrompt(type, topic, context) {
    const base = context
      ? `Based on this content:\n${context.slice(0, 8000)}\n\n`
      : `On the topic of: ${topic}\n\n`;

    switch (type) {
      case 'quiz':
        return base + 'Create a quiz with 10 multiple-choice questions. Return JSON: [{"question":"...","options":["A","B","C","D"],"correctAnswer":0,"explanation":"..."}]';
      case 'flashcard':
        return base + 'Create 15 flashcards. Return JSON: [{"front":"question or term","back":"answer or definition"}]';
      case 'guide':
        return base + 'Create a comprehensive study guide with key concepts, definitions, examples, and a summary. Use markdown headers and bullet points.';
      default:
        return base + 'Create helpful study content.';
    }
  }

  async openAIFallback(type, prompt) {
    try {
      const { OpenAI } = require('openai');
      const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const res = await ai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert educational content creator.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000
      });
      const content = res.choices[0].message.content;
      if (type === 'quiz' || type === 'flashcard') {
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
        return JSON.parse(jsonMatch ? jsonMatch[1] : content);
      }
      return { text: content };
    } catch (e) {
      console.error('OpenAI fallback failed:', e.message);
      return null;
    }
  }

  getMock(type, topic) {
    switch (type) {
      case 'quiz':
        return [{ question: `Sample question about ${topic || 'the topic'}?`, options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 0, explanation: 'Configure Gemini, Bedrock, or OpenAI for real content.' }];
      case 'flashcard':
        return [{ front: `What is ${topic || 'the topic'}?`, back: 'Configure an AI API key for real content.' }];
      case 'guide':
        return { text: `# Study Guide: ${topic || 'Topic'}\n\nConfigure an AI API key for real content generation.` };
      default:
        return { text: 'Mock content' };
    }
  }
}

module.exports = new StudyService();
