const { OpenAI } = require('openai');
const File = require('../models/File');
const fs = require('fs');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class TutoringService {
  async answerQuestion(question, fileIds, userId) {
    try {
      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key') {
        console.warn('OpenAI API key not configured, returning mock answer');
        return 'This is a mock answer. Please configure OPENAI_API_KEY in your .env file to use actual AI tutoring.';
      }

      // Get context from files
      let context = '';
      if (fileIds.length > 0) {
        const files = await File.find({ 
          _id: { $in: fileIds },
          userId: userId
        });

        for (const file of files) {
          // Add transcription or file content to context
          if (file.transcription && file.transcription.text) {
            context += `\n\nFrom ${file.originalName}:\n${file.transcription.text}`;
          } else if (file.fileType === 'text/plain' && file.localPath) {
            try {
              const content = fs.readFileSync(file.localPath, 'utf-8');
              context += `\n\nFrom ${file.originalName}:\n${content}`;
            } catch (error) {
              console.error(`Error reading file ${file.originalName}:`, error);
            }
          }
        }
      }

      // Generate answer using GPT
      const systemPrompt = `You are an intelligent AI tutor helping a student. Use the provided context from their study materials to answer questions accurately and helpfully. If the context doesn't contain relevant information, use your general knowledge to provide a helpful answer.`;

      const userPrompt = context 
        ? `Context from study materials:\n${context}\n\nQuestion: ${question}`
        : `Question: ${question}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Tutoring error:', error);
      throw new Error('Failed to generate answer');
    }
  }

  // This would integrate with a vector database for true RAG
  async indexDocument(fileId, content) {
    // Placeholder for vector database integration (e.g., Pinecone)
    // This would embed the content and store it in a vector database
    console.log(`Indexing document ${fileId} for RAG`);
  }
}

module.exports = new TutoringService();
