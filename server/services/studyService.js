const { OpenAI } = require('openai');
const File = require('../models/File');
const fs = require('fs');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class StudyService {
  async generateContent(type, title, fileIds, userId, topic) {
    try {
      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key') {
        console.warn('OpenAI API key not configured, returning mock content');
        return this.getMockContent(type, topic);
      }

      // Get context from files
      let context = '';
      if (fileIds.length > 0) {
        const files = await File.find({ 
          _id: { $in: fileIds },
          userId: userId
        });

        for (const file of files) {
          if (file.transcription && file.transcription.text) {
            context += `\n\n${file.transcription.text}`;
          } else if (file.fileType === 'text/plain' && file.localPath) {
            try {
              const content = fs.readFileSync(file.localPath, 'utf-8');
              context += `\n\n${content}`;
            } catch (error) {
              console.error(`Error reading file ${file.originalName}:`, error);
            }
          }
        }
      }

      const prompt = this.getPromptForType(type, topic, context);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an expert educational content creator.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const generatedContent = completion.choices[0].message.content;
      return this.parseContent(type, generatedContent);
    } catch (error) {
      console.error('Content generation error:', error);
      throw new Error('Failed to generate study content');
    }
  }

  getPromptForType(type, topic, context) {
    const baseContext = context ? `Based on this content:\n${context}\n\n` : `On the topic of: ${topic}\n\n`;

    switch (type) {
      case 'quiz':
        return `${baseContext}Create a quiz with 10 multiple-choice questions. Format each question as JSON with: question, options (array of 4), correctAnswer (index), explanation.`;
      
      case 'flashcard':
        return `${baseContext}Create 15 flashcards for studying. Format each as JSON with: front (question/term), back (answer/definition).`;
      
      case 'guide':
        return `${baseContext}Create a comprehensive study guide with key concepts, definitions, examples, and summary points. Use markdown formatting.`;
      
      default:
        return baseContext + 'Create helpful study content.';
    }
  }

  parseContent(type, content) {
    try {
      // Try to parse as JSON for quiz and flashcards
      if (type === 'quiz' || type === 'flashcard') {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[1]);
        }
        // Try to parse the whole content
        return JSON.parse(content);
      }
      // For guides, return as-is (markdown)
      return { text: content };
    } catch (error) {
      // If parsing fails, return raw content
      console.warn('Failed to parse content as JSON, returning raw content');
      return { raw: content };
    }
  }

  getMockContent(type, topic) {
    switch (type) {
      case 'quiz':
        return [
          {
            question: `Sample question about ${topic || 'the topic'}?`,
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 0,
            explanation: 'This is a mock quiz. Configure OPENAI_API_KEY for real content.'
          }
        ];
      
      case 'flashcard':
        return [
          {
            front: `What is ${topic || 'the topic'}?`,
            back: 'This is a mock flashcard. Configure OPENAI_API_KEY for real content.'
          }
        ];
      
      case 'guide':
        return {
          text: `# Study Guide: ${topic || 'Topic'}\n\nThis is a mock study guide. Configure OPENAI_API_KEY for real content.`
        };
      
      default:
        return { text: 'Mock content' };
    }
  }
}

module.exports = new StudyService();
