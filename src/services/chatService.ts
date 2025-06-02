
import { GROQ_API_KEY, COHERE_API_KEY } from '@/utils/constants';
import { webSearchService } from './webSearchService';

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

  private buildSystemPrompt(context?: ChatContext): string {
    let prompt = `You are Aurafy, a helpful AI life co-pilot assistant. Be friendly, supportive, and provide practical advice. Keep responses concise but helpful. You can analyze patterns across nutrition, mood, tasks, and symptoms to provide insights.

If a user asks about current events, weather, or information that requires real-time data, suggest they use the AI Search tool for the most up-to-date information.`;
    
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
    
    // Add cross-section analysis capability
    if (context && Object.keys(context).length > 1) {
      prompt += `\n\nYou can analyze patterns and connections between the user's nutrition, mood, tasks, and symptoms. Look for relationships like:
      - How nutrition affects mood and energy levels
      - Whether symptoms correlate with eating patterns
      - How mood impacts task completion
      - Patterns between lifestyle factors and wellbeing`;
    }
    
    return prompt;
  }

  public detectIntent(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Check if user is asking for web search
    if (lowerMessage.includes('search for') || lowerMessage.includes('look up') || 
        lowerMessage.includes('find information about') || lowerMessage.includes('what is') ||
        lowerMessage.includes('weather in') || lowerMessage.includes('current') ||
        lowerMessage.includes('latest') || lowerMessage.includes('news about')) {
      return 'web_search';
    }
    
    // Cross-section analysis patterns
    if (lowerMessage.includes('pattern') || lowerMessage.includes('relationship') || lowerMessage.includes('connection') || 
        (lowerMessage.includes('mood') && (lowerMessage.includes('food') || lowerMessage.includes('nutrition'))) ||
        (lowerMessage.includes('symptom') && (lowerMessage.includes('food') || lowerMessage.includes('mood'))) ||
        lowerMessage.includes('related to') || lowerMessage.includes('affect')) {
      return 'cross_analysis';
    }
    
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
      const intent = this.detectIntent(message);
      
      // Handle web search requests
      if (intent === 'web_search') {
        return await webSearchService.search(message);
      }
      
      return await this.callGroqAPI(message, context);
    } catch (error) {
      console.error('Chat service error:', error);
      return 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.';
    }
  }
}

export const chatService = new ChatService();
