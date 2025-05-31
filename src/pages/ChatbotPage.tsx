
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Wrench, Mic, MicOff } from 'lucide-react';
import { useLocalChat } from '@/hooks/useLocalChat';
import { useLocalNutrition } from '@/hooks/useLocalNutrition';
import { useLocalTasks } from '@/hooks/useLocalTasks';
import { useLocalMood } from '@/hooks/useLocalMood';
import { useLocalSymptoms } from '@/hooks/useLocalSymptoms';
import { chatService } from '@/services/chatService';
import { generateId, getTimestamp, formatTime } from '@/utils/helpers';
import { ChatMessage } from '@/types';
import { ToolkitModal } from '@/components/chat/ToolkitModal';
import { toast } from "sonner";

interface ChatbotPageProps {
  onNavigateBack: () => void;
}

export const ChatbotPage: React.FC<ChatbotPageProps> = ({ onNavigateBack }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToolkit, setShowToolkit] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages, addMessage } = useLocalChat();
  const { getTodaysCalories, getTodaysEntries } = useLocalNutrition();
  const { getTodaysTasks, getTodaysCompletedCount, getTodaysTotalCount } = useLocalTasks();
  const { getTodaysMoodScore, getLatestMood, getWeeklyAverage } = useLocalMood();
  const { symptoms } = useLocalSymptoms();

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
  }, []);

  const buildContext = (userMessage: string) => {
    const intent = chatService.detectIntent(userMessage);
    const context: any = {};

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

    addMessage(userMessage);
    const messageText = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      const context = buildContext(messageText);
      const response = await chatService.sendMessage(messageText, context);
      
      const auroraMessage: ChatMessage = {
        id: generateId(),
        sender: 'aurora',
        text: response,
        timestamp: getTimestamp(),
      };

      addMessage(auroraMessage);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: generateId(),
        sender: 'aurora',
        text: 'I apologize, but I encountered an error. Please try again.',
        timestamp: getTimestamp(),
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (!recognition) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognition.start();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onNavigateBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Aurafy Chat
          </h1>
        </div>
        
        <Button variant="ghost" size="sm" onClick={() => setShowToolkit(true)}>
          <Wrench className="h-5 w-5" />
        </Button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-600 dark:text-gray-400 mt-8">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Welcome to Aurafy!</h3>
            <p>I'm your AI Life Co-Pilot. Ask me about your nutrition, tasks, mood, or anything else!</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow ${
                message.sender === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p className={`text-xs mt-1 ${
                message.sender === 'user' 
                  ? 'text-purple-200' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2 items-end">
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              rows={1}
              className="resize-none pr-10"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVoiceInput}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${
                isListening ? 'text-red-500' : 'text-gray-400'
              }`}
              disabled={isLoading}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {isListening && (
          <p className="text-sm text-red-500 mt-2">Listening... Speak now</p>
        )}
      </div>

      {/* Toolkit Modal */}
      {showToolkit && (
        <ToolkitModal
          isOpen={showToolkit}
          onClose={() => setShowToolkit(false)}
          onToolSelect={(tool) => {
            setShowToolkit(false);
            toast.info(`${tool} tool selected - Feature coming soon!`);
          }}
        />
      )}
    </div>
  );
};
