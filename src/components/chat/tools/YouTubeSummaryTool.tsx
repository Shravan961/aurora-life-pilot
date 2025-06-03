
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Youtube, Loader2, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface YouTubeSummaryToolProps {
  onSendToChat: (message: string) => void;
}

interface VideoData {
  title: string;
  description?: string;
  transcript?: string;
  url: string;
}

export const YouTubeSummaryTool: React.FC<YouTubeSummaryToolProps> = ({ onSendToChat }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastVideoData, setLastVideoData] = useState<VideoData | null>(null);
  const { toast } = useToast();

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|m\.youtube\.com\/watch\?v=|youtube\.com\/shorts\/)([^&#?\n]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const fetchTranscript = async (videoId: string): Promise<string | null> => {
    try {
      console.log('Attempting to fetch transcript for video:', videoId);
      
      // Try using youtube-transcript package
      const { YoutubeTranscript } = await import('youtube-transcript');
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      
      if (transcript && transcript.length > 0) {
        const fullTranscript = transcript.map(entry => entry.text).join(' ');
        console.log('Transcript fetched successfully, length:', fullTranscript.length);
        return fullTranscript;
      }
    } catch (error) {
      console.log('Primary transcript method failed:', error);
    }

    // Try alternative method with CORS proxy
    try {
      const response = await fetch(`https://corsproxy.io/?https://www.youtube.com/watch?v=${videoId}`);
      const html = await response.text();
      
      // Look for captions in the page
      const captionMatch = html.match(/"captions":({.*?})/);
      if (captionMatch) {
        console.log('Found caption data in page');
        // This would need more complex parsing, so we'll fall back to metadata
      }
    } catch (error) {
      console.log('CORS proxy method failed:', error);
    }

    return null;
  };

  const fetchVideoMetadata = async (videoId: string): Promise<{ title: string; description?: string }> => {
    try {
      const response = await fetch(`https://corsproxy.io/?https://www.youtube.com/watch?v=${videoId}`);
      const html = await response.text();
      
      // Extract title using multiple methods
      let title = '';
      const titleMatch = html.match(/<title>(.+?)<\/title>/);
      if (titleMatch) {
        title = titleMatch[1].replace(' - YouTube', '').trim();
      }
      
      if (!title) {
        const ogTitleMatch = html.match(/property="og:title" content="([^"]+)"/);
        if (ogTitleMatch) {
          title = ogTitleMatch[1];
        }
      }
      
      // Extract description
      let description = '';
      const descMatch = html.match(/property="og:description" content="([^"]+)"/);
      if (descMatch) {
        description = descMatch[1];
      }
      
      return {
        title: title || `YouTube Video ${videoId}`,
        description: description || undefined
      };
    } catch (error) {
      console.log('Metadata extraction failed:', error);
      return { title: `YouTube Video ${videoId}` };
    }
  };

  const generateSummary = async (videoData: VideoData): Promise<string> => {
    const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
    
    if (!groqApiKey) {
      throw new Error('Groq API key not configured');
    }

    let content = '';
    if (videoData.transcript) {
      content = `Title: ${videoData.title}\n\nTranscript: ${videoData.transcript}`;
    } else {
      content = `Title: ${videoData.title}`;
      if (videoData.description) {
        content += `\n\nDescription: ${videoData.description}`;
      }
    }

    // Chunk content if too long (approximate token limit)
    const maxLength = 30000; // Conservative estimate for token limits
    if (content.length > maxLength) {
      content = content.substring(0, maxLength) + '...';
    }

    const prompt = `Please provide a comprehensive summary of this YouTube video:

${content}

Format your response as follows:
🎯 **Main Topic**: [Brief overview]

📋 **Key Takeaways**:
• [Point 1]
• [Point 2]
• [Point 3]

💡 **Highlights**:
• [Important insight 1]
• [Important insight 2]

🔗 **Source**: ${videoData.url}

Keep it concise but informative, focusing on the most valuable insights.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'system',
            content: 'You are an expert content analyst who creates engaging, structured summaries of video content.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Groq API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No summary could be generated.';
  };

  const handleSummarize = async () => {
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a YouTube URL",
        variant: "destructive"
      });
      return;
    }

    const videoId = extractVideoId(url.trim());
    if (!videoId) {
      toast({
        title: "Error", 
        description: "Invalid YouTube URL format",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Processing video ID:', videoId);
      
      // Fetch transcript
      const transcript = await fetchTranscript(videoId);
      
      // Fetch metadata
      const metadata = await fetchVideoMetadata(videoId);
      
      const videoData: VideoData = {
        title: metadata.title,
        description: metadata.description,
        transcript: transcript || undefined,
        url: url.trim()
      };
      
      setLastVideoData(videoData);
      
      if (!transcript) {
        toast({
          title: "Info",
          description: "No transcript found. Summarizing based on title and description.",
        });
      }
      
      // Generate summary using Groq
      const summary = await generateSummary(videoData);
      
      // Send to chat
      onSendToChat(`YouTube Summary: ${videoData.title}\n\n${summary}`);
      
      // Clear input on success
      setUrl('');
      
      toast({
        title: "Success",
        description: "Video summarized successfully!"
      });
      
    } catch (error) {
      console.error('Summarization error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to summarize video",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!lastVideoData) return;
    
    setLoading(true);
    
    try {
      const summary = await generateSummary(lastVideoData);
      onSendToChat(`YouTube Summary (Regenerated): ${lastVideoData.title}\n\n${summary}`);
      
      toast({
        title: "Success",
        description: "Summary regenerated successfully!"
      });
    } catch (error) {
      console.error('Regeneration error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to regenerate summary",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Youtube className="h-5 w-5" />
          YouTube Summary
        </CardTitle>
        <CardDescription>
          Get AI-powered summaries of YouTube videos with key takeaways and highlights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Paste YouTube URL here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            onKeyPress={(e) => e.key === 'Enter' && !loading && handleSummarize()}
          />
          <Button 
            onClick={handleSummarize} 
            disabled={loading || !url.trim()}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Summarize'
            )}
          </Button>
        </div>
        
        {lastVideoData && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex-1">
              <p className="font-medium text-sm">{lastVideoData.title}</p>
              <p className="text-xs text-muted-foreground">Last processed video</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              disabled={loading}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Regenerate
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
