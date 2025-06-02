
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Youtube, Loader2 } from 'lucide-react';
import { chatService } from '@/services/chatService';
import { toast } from "sonner";

interface YouTubeSummaryToolProps {
  onSendToChat: (message: string) => void;
}

export const YouTubeSummaryTool: React.FC<YouTubeSummaryToolProps> = ({ onSendToChat }) => {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const getVideoTranscript = async (videoId: string): Promise<string> => {
    try {
      // Using a CORS proxy to access YouTube transcript
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`);
      const data = await response.json();
      
      // Extract video title and description from the HTML
      const html = data.contents;
      const titleMatch = html.match(/<title>([^<]+)<\/title>/);
      const title = titleMatch ? titleMatch[1].replace(' - YouTube', '') : 'YouTube Video';
      
      // For demo purposes, we'll use the title and description as "transcript"
      // In a real implementation, you'd use youtube-transcript-api or similar
      const descMatch = html.match(/"shortDescription":"([^"]+)"/);
      const description = descMatch ? descMatch[1].slice(0, 500) : 'No description available';
      
      return `Video Title: ${title}\n\nDescription: ${description}`;
    } catch (error) {
      throw new Error('Could not fetch video transcript');
    }
  };

  const handleSummarize = async () => {
    if (!url.trim()) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      toast.error('Invalid YouTube URL format');
      return;
    }

    setIsProcessing(true);
    try {
      const transcript = await getVideoTranscript(videoId);
      const summary = await chatService.sendMessage(
        `Please provide a concise summary of this YouTube video:\n\n${transcript}`
      );
      
      onSendToChat(`📺 **YouTube Video Summary:**\n\n${summary}\n\n🔗 [Watch Video](${url})`);
      toast.success('Video summarized successfully');
      setUrl('');
    } catch (error) {
      console.error('YouTube summary error:', error);
      toast.error('Failed to summarize video. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Youtube className="h-5 w-5 text-red-500" />
            <span>YouTube Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Paste YouTube URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isProcessing}
            />
            <Button 
              onClick={handleSummarize} 
              disabled={!url.trim() || isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Summarizing...
                </>
              ) : (
                'Summarize Video'
              )}
            </Button>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Get AI-powered summaries of YouTube videos instantly
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
