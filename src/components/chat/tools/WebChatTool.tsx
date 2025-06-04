
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Loader2, Globe, X } from 'lucide-react';
import { GROQ_API_KEY, GROQ_MODEL } from '@/utils/constants';
import { memoryService } from '@/services/memoryService';
import { toast } from "sonner";

interface WebChatToolProps {
  onSendToChat: (message: string) => void;
}

export const WebChatTool: React.FC<WebChatToolProps> = ({ onSendToChat }) => {
  const [url, setUrl] = useState('');
  const [question, setQuestion] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadedContent, setLoadedContent] = useState<string>('');
  const [loadedUrl, setLoadedUrl] = useState<string>('');
  const [conversationHistory, setConversationHistory] = useState<Array<{question: string, answer: string}>>([]);
  const [conversationThreadId, setConversationThreadId] = useState<string | null>(null);
  const [showConversation, setShowConversation] = useState(false);

  const extractWebContent = async (url: string): Promise<string> => {
    try {
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = data.contents;
      
      // Remove scripts and styles
      const scripts = tempDiv.querySelectorAll('script, style');
      scripts.forEach(el => el.remove());
      
      // Extract meaningful content
      let content = '';
      const contentSelectors = [
        'article', '[role="main"]', 'main', '.content', '.post-content', 
        '.entry-content', '.article-content', 'p'
      ];
      
      for (const selector of contentSelectors) {
        const elements = tempDiv.querySelectorAll(selector);
        if (elements.length > 0) {
          content = Array.from(elements)
            .map(el => el.textContent)
            .join('\n')
            .trim();
          if (content.length > 500) break;
        }
      }
      
      if (!content || content.length < 100) {
        content = tempDiv.textContent || '';
      }
      
      return content.replace(/\s+/g, ' ').trim().substring(0, 4000);
    } catch (error) {
      throw new Error('Failed to load webpage content');
    }
  };

  const handleLoadPage = async () => {
    if (!url.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }

    try {
      new URL(url);
    } catch {
      toast.error('Please enter a valid URL format');
      return;
    }

    setIsProcessing(true);
    try {
      const content = await extractWebContent(url);
      setLoadedContent(content);
      setLoadedUrl(url);
      
      // Create conversation thread
      const threadId = memoryService.createThread('web_chat', `Web Chat: ${url}`);
      setConversationThreadId(threadId);
      memoryService.activateThread(threadId);
      
      // Save initial content to memory
      memoryService.addToThread(threadId, {
        type: 'web_chat',
        title: `Loaded webpage: ${url}`,
        content: content.substring(0, 500) + '...',
        metadata: { url }
      });
      
      setShowConversation(true);
      toast.success('Webpage loaded successfully');
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Failed to load webpage. Please check the URL.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      toast.error('Please enter a question');
      return;
    }

    if (!loadedContent) {
      toast.error('Please load a webpage first');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant that answers questions based on webpage content. Provide accurate, detailed responses based only on the provided content. Reference specific parts of the content when relevant.'
            },
            {
              role: 'user',
              content: `Based on the following webpage content, please answer this question: "${question}"\n\nWebpage URL: ${loadedUrl}\n\nContent:\n${loadedContent}\n\nPrevious conversation context:\n${conversationHistory.map(c => `Q: ${c.question}\nA: ${c.answer}`).join('\n\n')}`
            }
          ],
          max_tokens: 1000,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate answer');
      }

      const data = await response.json();
      const answer = data.choices[0]?.message?.content || 'Could not generate answer';
      
      const newConversation = { question: question.trim(), answer };
      setConversationHistory(prev => [...prev, newConversation]);
      
      // Save to memory and thread
      if (conversationThreadId) {
        memoryService.addToThread(conversationThreadId, {
          type: 'web_chat',
          title: `Q: ${question.trim()}`,
          content: `Q: ${question.trim()}\nA: ${answer}`,
          metadata: { url: loadedUrl }
        });
      }
      
      setQuestion('');
      toast.success('Question answered');
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to answer question. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseConversation = () => {
    setShowConversation(false);
    setConversationHistory([]);
    if (conversationThreadId) {
      memoryService.deactivateAllThreads();
    }
    setConversationThreadId(null);
    setLoadedContent('');
    setLoadedUrl('');
    setUrl('');
    onSendToChat(`🌐 **Web Chat Session Ended**\n\nConversation history has been saved to memory. You can reference this chat later!`);
  };

  if (showConversation && loadedContent) {
    return (
      <div className="w-80 h-full flex flex-col bg-white border-l">
        <div className="flex items-center justify-between p-4 border-b bg-green-50">
          <div className="flex items-center space-x-2">
            <Globe className="h-5 w-5 text-green-500" />
            <div>
              <h3 className="font-semibold text-sm">Web Chat</h3>
              <p className="text-xs text-gray-600 truncate max-w-[200px]">{loadedUrl}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleCloseConversation}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {conversationHistory.length === 0 ? (
            <div className="text-center text-gray-500 text-sm">
              <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Ask questions about this webpage!</p>
            </div>
          ) : (
            conversationHistory.map((conv, index) => (
              <div key={index} className="space-y-2">
                <div className="bg-green-100 p-2 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Q: {conv.question}</p>
                </div>
                <div className="bg-gray-100 p-2 rounded-lg">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{conv.answer}</p>
                </div>
              </div>
            ))
          )}
          
          {isProcessing && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm text-gray-600">Processing question...</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Ask about the webpage..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isProcessing}
              onKeyPress={(e) => e.key === 'Enter' && !isProcessing && handleAskQuestion()}
              className="text-sm"
            />
            <Button 
              onClick={handleAskQuestion} 
              disabled={!question.trim() || isProcessing}
              size="sm"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageSquare className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            This conversation is being saved to memory for future reference.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-green-500" />
            <span>Enhanced Web Chat</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Enter webpage URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isProcessing}
            />
            <Button 
              onClick={handleLoadPage} 
              disabled={!url.trim() || isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading Page...
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  Load & Chat with Webpage
                </>
              )}
            </Button>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Load any webpage and engage in continuous conversation. The chat will open in the right panel with full memory integration.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
