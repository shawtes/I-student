const bedrock = require('./bedrockClient');
const fs = require('fs');

class TranscriptionService {
  // Audio transcription still uses OpenAI Whisper (Bedrock doesn't have STT).
  // After transcription, we use Bedrock to generate a summary + key points.
  async transcribe(fileId, filePath) {
    try {
      // Whisper for speech-to-text
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key') {
        const { OpenAI } = require('openai');
        const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const audioFile = fs.createReadStream(filePath);
        const result = await ai.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-1',
          language: 'en'
        });
        return result.text;
      }

      return 'Transcription requires an OpenAI API key (Whisper). Set OPENAI_API_KEY in your environment.';
    } catch (err) {
      console.error('Transcription error:', err);
      throw new Error('Failed to transcribe audio');
    }
  }

  // Post-transcription: extract key points and a summary using Bedrock
  async summarize(transcriptionText) {
    const result = await bedrock.invokeJSON({
      messages: [{
        role: 'user',
        content: `Summarize this lecture transcript. Extract:
1. A brief summary (2-3 sentences)
2. Key points (bullet list)
3. Glossary terms (term + definition)
4. Action items or assignments mentioned

Return JSON: {"summary":"...","keyPoints":["..."],"glossary":[{"term":"...","definition":"..."}],"actionItems":["..."]}

Transcript:
${transcriptionText.slice(0, 12000)}`
      }],
      system: 'You extract structured notes from lecture transcripts. Respond with valid JSON only.',
      model: 'haiku',
    });

    return result || {
      summary: 'Summary not available (AI service unreachable)',
      keyPoints: [],
      glossary: [],
      actionItems: []
    };
  }
}

module.exports = new TranscriptionService();
