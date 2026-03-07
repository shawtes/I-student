const { OpenAI } = require('openai');
const fs = require('fs');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class TranscriptionService {
  async transcribe(fileId, filePath) {
    try {
      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key') {
        console.warn('OpenAI API key not configured, returning mock transcription');
        return 'This is a mock transcription. Please configure OPENAI_API_KEY in your .env file to use actual transcription.';
      }

      // Read file
      const audioFile = fs.createReadStream(filePath);

      // Transcribe using Whisper
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'en'
      });

      return transcription.text;
    } catch (error) {
      console.error('Transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }
}

module.exports = new TranscriptionService();
