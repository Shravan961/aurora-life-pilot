
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Wrench, Mic, MicOff, Trash2 } from 'lucide-react';
import { useLocalNutrition } from '@/hooks/useLocalNutrition';
import { useLocalTasks } from '@/hooks/useLocalTasks';
import { useLocalMood } from '@/hooks/useLocalMood';
import { useLocalSymptoms } from '@/hooks/useLocalSymptoms';
import { chatService } from '@/services/chatService';
import { generateId, getTimestamp, formatTime } from '@/utils/helpers';
import { ChatMessage } from '@/types';
import { ToolkitModal } from '@/components/chat/ToolkitModal';
import { ToolkitSidebar } from '@/components/chat/ToolkitSidebar';
import { chatStorage } from '@/services/chatDatabase';
import { toast } from "sonner";

interface ChatbotPageProps {
  onNavigateBack: () => void;
}

export const ChatbotPage: React.FC<ChatbotPageProps> = ({ onNavigateBack }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToolkit, setShowToolkit] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeClone, setActiveClone] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { getTodaysCalories, getTodaysEntries } = useLocalNutrition();
  const { getTodaysTasks, getTodaysCompletedCount, getTodaysTotalCount } = useLocalTasks();
  const { getTodaysMoodScore, getLatestMood, getWeeklyAverage } = useLocalMood();
  const { symptoms } = useLocalSymptoms();

  useEffect(() => {
    loadMessages();
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      
      recognition.onerror = () => {
        setIsListening(false);
        toast.error('Speech recognition error. Please try again.');
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognition);
    }

    // Load active clone
    const storedClone = localStorage.getItem('activeClone');
    if (storedClone) {
      setActiveClone(JSON.parse(storedClone));
    }
  }, []);

  const loadMessages = async () => {
    try {
      const storedMessages = await chatStorage.getMessages();
      setMessages(storedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const addMessage = async (message: ChatMessage) => {
    try {
      await chatStorage.addMessage({
        timestamp: message.timestamp,
        sender: message.sender,
        content: message.text,
        type: 'message',
        threadId: 'default'
      });
      setMessages(prev => [...prev, message]);
    } catch (error) {
      console.error('Error saving message:', error);
      setMessages(prev => [...prev, message]);
    }
  };

  const clearChat = async () => {
    try {
      await chatStorage.clearMessages();
      setMessages([]);
      setActiveClone(null);
      localStorage.removeItem('activeClone');
      toast.success('Chat cleared');
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast.error('Failed to clear chat');
    }
  };

  const buildContext = (userMessage: string) => {
    const intent = chatService.detectIntent(userMessage);
    const context: any = {};

    // Check for clone deactivation
    if (activeClone && (
      userMessage.toLowerCase().includes('stop') ||
      userMessage.toLowerCase().includes('okay you can stop') ||
      userMessage.toLowerCase().includes('revert to normal')
    )) {
      setActiveClone(null);
      localStorage.removeItem('activeClone');
      return { deactivateClone: true };
    }

    // For cross-analysis queries, include all relevant data
    if (intent === 'cross_analysis') {
      context.nutritionData = {
        todaysCalories: getTodaysCalories(),
        todaysEntries: getTodaysEntries(),
        totalEntries: getTodaysEntries().length
      };
      context.taskData = {
        todaysTasks: getTodaysTasks(),
        completedCount: getTodaysCompletedCount(),
        totalCount: getTodaysTotalCount(),
        pendingTasks: getTodaysTasks().filter(task => !task.completed)
      };
      context.moodData = {
        todaysMood: getTodaysMoodScore(),
        latestMood: getLatestMood(),
        weeklyAverage: getWeeklyAverage()
      };
      context.symptomData = {
        recentSymptoms: symptoms.slice(0, 5)
      };
    } else {
      // Include specific context based on intent
      if (intent === 'nutrition_query') {
        context.nutritionData = {
          todaysCalories: getTodaysCalories(),
          todaysEntries: getTodaysEntries(),
          totalEntries: getTodaysEntries().length
        };
      }

      if (intent === 'task_query') {
        context.taskData = {
          todaysTasks: getTodaysTasks(),
          completedCount: getTodaysCompletedCount(),
          totalCount: getTodaysTotalCount(),
          pendingTasks: getTodaysTasks().filter(task => !task.completed)
        };
      }

      if (intent === 'mood_query') {
        context.moodData = {
          todaysMood: getTodaysMoodScore(),
          latestMood: getLatestMood(),
          weeklyAverage: getWeeklyAverage()
        };
      }

      if (intent === 'symptom_query') {
        context.symptomData = {
          recentSymptoms: symptoms.slice(0, 5)
        };
      }
    }

    return context;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      sender: 'user',
      text: input.trim(),
      timestamp: getTimestamp(),
    };

    await addMessage(userMessage);
    const messageText = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      const context = buildContext(messageText);
      
      if (context.deactivateClone) {
        const auroraMessage: ChatMessage = {
          id: generateId(),
          sender: 'aurora',
          text: 'I\'ve returned to normal mode. How can I help you?',
          timestamp: getTimestamp(),
        };
        await addMessage(auroraMessage);
        setIsLoading(false);
        return;
      }

      // Use clone prompt if active
      let prompt = messageText;
      if (activeClone) {
        prompt = `${activeClone.systemPrompt}\n\nUser: ${messageText}`;
      }

      const response = await chatService.sendMessage(prompt, context);
      
      const auroraMessage: ChatMessage = {
        id: generateId(),
        sender: activeClone ? activeClone.name : 'aurora',
        text: response,
        timestamp: getTimestamp(),
      };

      await addMessage(auroraMessage);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: generateId(),
        sender: 'aurora',
        text: 'I apologize, but I encountered an error. Please try again.',
        timestamp: getTimestamp(),
      };
      await addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = async () => {
    if (!recognition) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    // Request permission first
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (isListening) {
        recognition.stop();
        setIsListening(false);
      } else {
        setIsListening(true);
        recognition.start();
      }
    } catch (error) {
      toast.error('Microphone permission denied');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleToolSelect = (toolName: string) => {
    setActiveTool(toolName);
    setShowToolkit(false);
  };

  const handleCloseTool = () => {
    setActiveTool(null);
  };

  const handleToolMessage = async (message: string) => {
    const toolMessage: ChatMessage = {
      id: generateId(),
      sender: 'aurora',
      text: message,
      timestamp: getTimestamp(),
    };
    await addMessage(toolMessage);
    setActiveTool(null);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onNavigateBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {activeClone ? activeClone.name : 'Aurafy'}
            </h1>
            <p className="text-xs text-green-500">Online</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={clearChat}>
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowToolkit(true)}>
            <Wrench className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Chat Messages */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23f0f0f0" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
            {messages.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-2xl">A</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-300">Welcome to Aurafy!</h3>
                <p className="text-gray-600 dark:text-gray-400">Your AI Life Co-Pilot is ready to help.</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Ask me about nutrition, tasks, mood, or anything else!</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-3`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white rounded-br-sm'
                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm border'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <p className={`text-xs mt-2 ${
                    message.sender === 'user' 
                      ? 'text-blue-100' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start mb-3">
                <div className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white max-w-xs lg:max-w-md px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm border">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {activeClone ? activeClone.name : 'Aurafy'} is typing...
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            {isListening && (
              <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span>Listening... Speak now</span>
                </p>
              </div>
            )}
            
            <div className="flex items-end space-x-2">
              <div className="flex-1 relative">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  disabled={isLoading}
                  rows={1}
                  className="resize-none pr-20 rounded-3xl border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleVoiceInput}
                    className={`${isListening ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'} p-1`}
                    disabled={isLoading}
                  >
                    {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowToolkit(true)}
                    disabled={isLoading}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <Wrench className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="rounded-full w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white"
                size="sm"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Toolkit Sidebar */}
        {activeTool && (
          <ToolkitSidebar
            activeTool={activeTool}
            onClose={handleCloseTool}
            onSendToChat={handleToolMessage}
          />
        )}
      </div>

      {/* Toolkit Modal */}
      {showToolkit && (
        <ToolkitModal
          isOpen={showToolkit}
          onClose={() => setShowToolkit(false)}
          onToolSelect={handleToolSelect}
        />
      )}
    </div>
  );
};
