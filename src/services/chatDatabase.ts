
import Dexie, { Table } from 'dexie';

export interface ChatMessage {
  id?: number;
  timestamp: number;
  sender: 'user' | 'aurora' | string; // string for clone names
  content: string;
  type: 'message' | 'tool' | 'clone';
  threadId?: string;
}

export class ChatDatabase extends Dexie {
  messages!: Table<ChatMessage>;

  constructor() {
    super('AurafyChatDB');
    this.version(1).stores({
      messages: '++id, timestamp, sender, content, type, threadId'
    });
  }
}

export const chatDB = new ChatDatabase();

export const chatStorage = {
  async addMessage(message: Omit<ChatMessage, 'id'>): Promise<number> {
    return await chatDB.messages.add(message);
  },

  async getMessages(threadId: string = 'default'): Promise<ChatMessage[]> {
    return await chatDB.messages
      .where('threadId')
      .equals(threadId)
      .orderBy('timestamp')
      .toArray();
  },

  async clearMessages(): Promise<void> {
    await chatDB.messages.clear();
  },

  async searchMessages(query: string): Promise<ChatMessage[]> {
    return await chatDB.messages
      .filter(msg => msg.content.toLowerCase().includes(query.toLowerCase()))
      .toArray();
  }
};
