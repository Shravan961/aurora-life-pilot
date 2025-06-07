import { GROQ_API_KEY, COHERE_API_KEY } from '@/utils/constants';
import { webSearchService } from './webSearchService';
import { format, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns';

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
      const { todaysTasks, completedCount, totalCount, pendingTasks } = context.taskData;
      prompt += `\n\nTask Context: You have access to the user's tasks:
- Total tasks for today: ${totalCount}
- Completed tasks: ${completedCount}
- Pending tasks: ${pendingTasks.length}
- Task details: ${JSON.stringify(todaysTasks)}

When discussing tasks:
1. Be specific about task names and their status
2. Provide encouraging feedback on task completion
3. Help prioritize remaining tasks
4. Suggest breaks if the user has completed many tasks
5. Offer to show task details when relevant`;
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
    
    // Enhanced task query detection
    if (lowerMessage.includes('task') || lowerMessage.includes('todo') || lowerMessage.includes('due') || 
        lowerMessage.includes('complete') || lowerMessage.includes('schedule') || lowerMessage.includes('plan') ||
        lowerMessage.includes('tomorrow') || lowerMessage.includes('today') || lowerMessage.includes('yesterday') ||
        lowerMessage.includes('next week') || lowerMessage.includes('this week')) {
      return 'task_query';
    }
    
    // Cross-section analysis patterns
    if (lowerMessage.includes('pattern') || lowerMessage.includes('relationship') || lowerMessage.includes('connection') || 
        (lowerMessage.includes('mood') && (lowerMessage.includes('food') || lowerMessage.includes('nutrition'))) ||
        (lowerMessage.includes('symptom') && (lowerMessage.includes('food') || lowerMessage.includes('mood'))) ||
        lowerMessage.includes('related to') || lowerMessage.includes('affect')) {
      return 'cross_analysis';
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

  private formatTasksResponse(tasks: any[], dateContext?: string): string {
    if (!tasks || tasks.length === 0) {
      return dateContext ? 
        `You don't have any tasks scheduled for ${dateContext}. Would you like me to help you plan some tasks?` : 
        'You currently have no tasks scheduled. Would you like to create some tasks to stay organized?';
    }

    const completedTasks = tasks.filter(t => t.completed);
    const pendingTasks = tasks.filter(t => !t.completed);

    let response = dateContext ? 
      `📅 Here's your task summary for ${dateContext}:\n\n` : 
      '📋 Here's your task summary:\n\n';

    if (pendingTasks.length > 0) {
      response += '⏳ Pending Tasks:\n';
      pendingTasks.forEach((task, index) => {
        response += `${index + 1}. ${task.title}\n`;
        if (task.note) {
          response += `   📝 ${task.note}\n`;
        }
      });
      response += '\n';
    }

    if (completedTasks.length > 0) {
      response += '✅ Completed Tasks:\n';
      completedTasks.forEach((task, index) => {
        response += `${index + 1}. ${task.title}\n`;
      });
      response += '\n';
    }

    response += `📊 Progress: ${completedTasks.length}/${tasks.length} tasks completed\n`;

    // Add encouraging message based on completion rate
    const completionRate = completedTasks.length / tasks.length;
    if (completionRate === 1) {
      response += "\n🎉 Amazing job! You've completed all your tasks!";
    } else if (completionRate >= 0.7) {
      response += "\n🌟 Great progress! You're almost there!";
    } else if (completionRate >= 0.3) {
      response += "\n💪 Keep going! You're making good progress.";
    } else {
      response += "\n🚀 Take it one task at a time, you've got this!";
    }

    return response;
  }

  private getTasksForDate(allTasks: any[], targetDate: string): any[] {
    return allTasks.filter(task => task.dueDate === targetDate);
  }

  private parseDateFromMessage(message: string): string | null {
    const today = new Date();
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('today')) {
      return format(today, 'yyyy-MM-dd');
    }
    
    if (lowerMessage.includes('tomorrow')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return format(tomorrow, 'yyyy-MM-dd');
    }
    
    if (lowerMessage.includes('yesterday')) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return format(yesterday, 'yyyy-MM-dd');
    }
    
    // Add more date parsing as needed
    return null;
  }

  async sendMessage(message: string, context?: ChatContext): Promise<string> {
    try {
      const intent = this.detectIntent(message);
      
      // Handle web search requests
      if (intent === 'web_search') {
        return await webSearchService.search(message);
      }
      
      // Handle task queries with enhanced functionality
      if (intent === 'task_query' && context?.taskData) {
        const targetDate = this.parseDateFromMessage(message);
        
        if (targetDate) {
          const tasksForDate = this.getTasksForDate(context.taskData, targetDate);
          const dateLabel = this.getDateLabel(targetDate);
          return this.formatTasksResponse(tasksForDate, dateLabel);
        } else {
          // General task query - show all tasks
          return this.formatTasksResponse(context.taskData);
        }
      }
      
      return await this.callGroqAPI(message, context);
    } catch (error) {
      console.error('Chat service error:', error);
      return 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.';
    }
  }

  private getDateLabel(dateString: string): string {
    const date = parseISO(dateString);
    
    if (isToday(date)) return 'today';
    if (isTomorrow(date)) return 'tomorrow';
    if (isYesterday(date)) return 'yesterday';
    
    return format(date, 'EEEE, MMMM do, yyyy');
  }
}

export const chatService = new ChatService();
