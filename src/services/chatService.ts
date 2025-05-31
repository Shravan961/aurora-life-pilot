
const GROQ_API_KEY = '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';
const COHERE_API_KEY = 'LVeqM6aavSJPysbxUdFdY3lgjWnit3d0LJvE9aAk';

class ChatService {
  private async callGroqAPI(message: string): Promise<string> {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            {
              role: 'system',
              content: 'You are Aurora, a helpful AI life co-pilot assistant. Be friendly, supportive, and provide practical advice. Keep responses concise but helpful.'
            },
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'I apologize, but I encountered an issue processing your request.';
    } catch (error) {
      console.error('Groq API error:', error);
      throw error;
    }
  }

  private async callCohereAPI(message: string): Promise<string> {
    try {
      const response = await fetch('https://api.cohere.ai/v1/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${COHERE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'command',
          prompt: `You are Aurora, an AI life co-pilot assistant. The user says: "${message}"\n\nRespond helpfully and supportively:`,
          max_tokens: 500,
          temperature: 0.7,
          stop_sequences: ['\n\n'],
        }),
      });

      if (!response.ok) {
        throw new Error(`Cohere API error: ${response.status}`);
      }

      const data = await response.json();
      return data.generations[0]?.text?.trim() || 'I apologize, but I encountered an issue processing your request.';
    } catch (error) {
      console.error('Cohere API error:', error);
      throw error;
    }
  }

  async sendMessage(message: string): Promise<string> {
    try {
      // Try Groq first for speed
      return await this.callGroqAPI(message);
    } catch (error) {
      console.warn('Groq failed, trying Cohere:', error);
      try {
        // Fallback to Cohere
        return await this.callCohereAPI(message);
      } catch (cohereError) {
        console.error('Both APIs failed:', cohereError);
        return 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.';
      }
    }
  }
}

export const chatService = new ChatService();
