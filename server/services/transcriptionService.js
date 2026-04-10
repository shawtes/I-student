const { OpenAI } = require('openai');
const fs = require('fs');

let openai;
function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key') {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

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
      const transcription = await getOpenAI().audio.transcriptions.create({
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
