
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Loader2, Globe } from 'lucide-react';
import { chatService } from '@/services/chatService';
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

  const loadWebpage = async (url: string): Promise<string> => {
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
      const content = await loadWebpage(url);
      setLoadedContent(content);
      setLoadedUrl(url);
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
      const prompt = `Based on the following webpage content, please answer this question: "${question}"\n\nWebpage URL: ${loadedUrl}\n\nContent:\n${loadedContent}`;
      
      const answer = await chatService.sendMessage(prompt);
      
      onSendToChat(`💬 **Web Chat Answer:**\n\n**Question:** ${question}\n**Source:** ${loadedUrl}\n\n**Answer:** ${answer}`);
      toast.success('Question answered');
      setQuestion('');
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to answer question. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-green-500" />
            <span>Web Chat</span>
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
              {isProcessing && !loadedContent ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading Page...
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  Load Webpage
                </>
              )}
            </Button>
          </div>

          {loadedContent && (
            <>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✅ Loaded: {loadedUrl}
                </p>
              </div>

              <div className="space-y-2">
                <Textarea
                  placeholder="Ask a question about the webpage..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={isProcessing}
                  rows={2}
                />
                <Button 
                  onClick={handleAskQuestion} 
                  disabled={!question.trim() || isProcessing}
                  className="w-full"
                >
                  {isProcessing && loadedContent ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Ask Question
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Load any webpage and chat with its content
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
