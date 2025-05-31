
import { GROQ_API_KEY, COHERE_API_KEY } from '@/utils/constants';

interface ChatContext {
  nutritionData?: any;
  taskData?: any;
  moodData?: any;
  symptomData?: any;
}

class ChatService {
  private async callGroqAPI(message: string, context?: ChatContext): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      
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
              content: systemPrompt
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

  private async callCohereAPI(message: string, context?: ChatContext): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      
      const response = await fetch('https://api.cohere.ai/v1/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${COHERE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'command',
          prompt: `${systemPrompt}\n\nUser: ${message}\nAurafy:`,
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

  private buildSystemPrompt(context?: ChatContext): string {
    let prompt = `You are Aurafy, a helpful AI life co-pilot assistant. Be friendly, supportive, and provide practical advice. Keep responses concise but helpful.`;
    
    if (context?.nutritionData) {
      prompt += `\n\nNutrition Context: The user has logged the following nutrition data: ${JSON.stringify(context.nutritionData)}`;
    }
    
    if (context?.taskData) {
      prompt += `\n\nTask Context: The user has the following tasks: ${JSON.stringify(context.taskData)}`;
    }
    
    if (context?.moodData) {
      prompt += `\n\nMood Context: The user's recent mood data: ${JSON.stringify(context.moodData)}`;
    }
    
    if (context?.symptomData) {
      prompt += `\n\nSymptom Context: The user has logged these symptoms: ${JSON.stringify(context.symptomData)}`;
    }
    
    return prompt;
  }

  public detectIntent(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('task') || lowerMessage.includes('todo') || lowerMessage.includes('due') || lowerMessage.includes('complete')) {
      return 'task_query';
    }
    
    if (lowerMessage.includes('eat') || lowerMessage.includes('meal') || lowerMessage.includes('food') || lowerMessage.includes('calorie') || lowerMessage.includes('nutrition')) {
      return 'nutrition_query';
    }
    
    if (lowerMessage.includes('mood') || lowerMessage.includes('feeling') || lowerMessage.includes('stress') || lowerMessage.includes('anxious') || lowerMessage.includes('happy') || lowerMessage.includes('sad')) {
      return 'mood_query';
    }
    
    if (lowerMessage.includes('symptom') || lowerMessage.includes('pain') || lowerMessage.includes('hurt') || lowerMessage.includes('sick')) {
      return 'symptom_query';
    }
    
    return 'general';
  }

  async sendMessage(message: string, context?: ChatContext): Promise<string> {
    try {
      // Try Groq first for speed
      return await this.callGroqAPI(message, context);
    } catch (error) {
      console.warn('Groq failed, trying Cohere:', error);
      try {
        // Fallback to Cohere
        return await this.callCohereAPI(message, context);
      } catch (cohereError) {
        console.error('Both APIs failed:', cohereError);
        return 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.';
      }
    }
  }
}

export const chatService = new ChatService();
