
import { useState, useEffect } from 'react';
import { ChatMessage } from '@/types';
import { STORAGE_KEYS } from '@/utils/constants';

export const useLocalChat = (threadId: string = 'default') => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
    if (stored) {
      try {
        const allMessages = JSON.parse(stored);
        const threadMessages = allMessages.filter((msg: ChatMessage) => 
          (msg.threadId || 'default') === threadId
        );
        setMessages(threadMessages);
      } catch (error) {
        console.error('Error parsing chat messages:', error);
        setMessages([]);
      }
    }
  }, [threadId]);

  const saveMessages = (newMessages: ChatMessage[]) => {
    setMessages(newMessages);
    
    // Save all messages for all threads
    const stored = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
    let allMessages: ChatMessage[] = [];
    
    if (stored) {
      try {
        allMessages = JSON.parse(stored);
      } catch (error) {
        console.error('Error parsing existing messages:', error);
      }
    }
    
    // Remove old messages for this thread and add new ones
    const otherThreadMessages = allMessages.filter(msg => 
      (msg.threadId || 'default') !== threadId
    );
    
    const updatedAllMessages = [...otherThreadMessages, ...newMessages];
    localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(updatedAllMessages));
  };

  const addMessage = (message: ChatMessage) => {
    const messageWithThread = { ...message, threadId };
    const newMessages = [...messages, messageWithThread];
    saveMessages(newMessages);
  };

  return {
    messages,
    addMessage
  };
};
