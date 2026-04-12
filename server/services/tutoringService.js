const gemini = require('./geminiClient');
const bedrock = require('./bedrockClient');
const { extractFromFiles } = require('./fileExtractor');

const SYSTEM_PROMPT = `You are an intelligent AI tutor helping a student at Georgia State University.

IMPORTANT RULES:
- ONLY reference documents that appear in the "Context from my study materials" section below.
- DO NOT make up or hallucinate file names, page numbers, or citations.
- If context is provided, base your answer on it and reference it by the exact filename shown.
- If no context is provided or the context doesn't answer the question, say "Based on my general knowledge:" and then answer. Do NOT pretend to cite a document.
- Give clear, concise explanations with examples when helpful.
- Remember the conversation history and refer back to earlier messages when relevant.`;

class TutoringService {
  // Single-shot answer (backward compat for POST /ask)
  async answerQuestion(question, fileIds, userId) {
    return this.chat(question, fileIds, userId, []);
  }

  // Multi-turn chat with conversation history
  async chat(question, fileIds, userId, history = []) {
    try {
      const context = await extractFromFiles(fileIds, userId);

      // Build the current user message
      let userMsg;
      if (context && context.trim().length > 50) {
        userMsg = `Context from my study materials:\n${context.slice(0, 12000)}\n\nQuestion: ${question}`;
      } else if (fileIds && fileIds.length > 0) {
        userMsg = `Note: Files were selected but text extraction was not possible. Answer from general knowledge and say so.\n\nQuestion: ${question}`;
      } else {
        userMsg = question;
      }

      // Build multi-turn messages (cap history to keep under token limit)
      const turns = this.buildTurns(history, userMsg);

      // 1. Try Gemini Flash
      const gAnswer = await gemini.invoke({
        prompt: this.turnsToGeminiPrompt(turns),
        system: SYSTEM_PROMPT,
        model: 'flash'
      });
      if (gAnswer) return gAnswer;

      // 2. Try Bedrock
      const bAnswer = await bedrock.invoke({
        messages: turns,
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
            ...turns
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

  // Auto-generate a short title from the first exchange
  async generateTitle(question, answer) {
    try {
      const title = await gemini.invoke({
        prompt: `Summarize this conversation in 5 words or fewer (no quotes, no period):\nUser: ${question.slice(0, 200)}\nAssistant: ${answer.slice(0, 200)}`,
        system: 'Respond with ONLY the title, nothing else.',
        model: 'flash'
      });
      return title ? title.replace(/^["']|["']$/g, '').trim().slice(0, 60) : null;
    } catch {
      return null;
    }
  }

  buildTurns(history, currentUserMsg) {
    // Take recent history, cap at ~8000 chars total
    const turns = [];
    let charCount = 0;
    const maxChars = 8000;

    // Add history from oldest to newest (but skip if too long)
    const recent = history.slice(-20); // max 20 turns
    for (const msg of recent) {
      const len = msg.content.length;
      if (charCount + len > maxChars) break;
      turns.push({ role: msg.role, content: msg.content });
      charCount += len;
    }

    // Always add the current message
    turns.push({ role: 'user', content: currentUserMsg });
    return turns;
  }

  // Gemini uses a single prompt string, not message array.
  // Flatten the multi-turn into a conversation transcript.
  turnsToGeminiPrompt(turns) {
    if (turns.length === 1) return turns[0].content;
    return turns.map(t =>
      t.role === 'user' ? `Student: ${t.content}` : `Tutor: ${t.content}`
    ).join('\n\n') + '\n\nTutor:';
  }
}

module.exports = new TutoringService();
