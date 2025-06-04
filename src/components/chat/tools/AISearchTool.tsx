
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GROQ_API_KEY, GROQ_MODEL } from '@/utils/constants';

interface AISearchToolProps {
  onSendToChat: (message: string) => void;
}

export const AISearchTool: React.FC<AISearchToolProps> = ({ onSendToChat }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const searchWeb = async (query: string): Promise<string[]> => {
    try {
      // Using DuckDuckGo for real-time search
      const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
      const data = await response.json();
      
      const results: string[] = [];
      
      // Add abstract if available
      if (data.Abstract) {
        results.push(`${data.AbstractSource || 'Source'}: ${data.Abstract}`);
      }
      
      // Add related topics
      if (data.RelatedTopics) {
        data.RelatedTopics.slice(0, 5).forEach((topic: any) => {
          if (topic.Text) {
            results.push(`Related: ${topic.Text}`);
          }
        });
      }
      
      // Add instant answer if available
      if (data.Answer) {
        results.unshift(`Direct Answer: ${data.Answer}`);
      }
      
      return results;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  };

  const generateSummary = async (query: string, searchResults: string[]): Promise<string> => {
    const searchContext = searchResults.join('\n\n');

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
            content: 'You are an expert research assistant who analyzes web search results and provides accurate, well-structured summaries. Focus on the most important and reliable information. Organize your response with clear bullet points and key insights.'
          },
          {
            role: 'user',
            content: `Query: "${query}"\n\nSearch Results:\n${searchContext}\n\nPlease provide a comprehensive summary that:\n1. Directly answers the user's query\n2. Highlights the most important information\n3. Organizes key points clearly\n4. Mentions any conflicting information if present\n\nFormat your response with bullet points where appropriate.`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Groq API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No summary could be generated.';
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({
        title: "Error",
        description: "Please enter a search query",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      console.log('🔍 Searching for:', query);
      
      // Perform real-time web search
      const searchResults = await searchWeb(query.trim());
      
      if (searchResults.length === 0) {
        throw new Error('No search results found');
      }

      console.log('📊 Search results obtained, generating AI summary...');
      
      // Generate AI summary using Groq
      const summary = await generateSummary(query.trim(), searchResults);
      
      // Send to chat with enhanced formatting
      const message = `🔍 **AI Search Results for:** "${query}"\n\n${summary}\n\n---\n*Powered by real-time web search + AI analysis*`;
      onSendToChat(message);
      
      // Clear input on success
      setQuery('');
      
      toast({
        title: "Success",
        description: "AI search completed successfully!"
      });
      
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to perform search",
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
          <Search className="h-5 w-5" />
          AI Search (Real-Time + Summarizing)
        </CardTitle>
        <CardDescription>
          Search the web in real-time and get AI-powered summaries with key insights and analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="What would you like to search for?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            onKeyPress={(e) => e.key === 'Enter' && !loading && handleSearch()}
          />
          <Button 
            onClick={handleSearch} 
            disabled={loading || !query.trim()}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Search'
            )}
          </Button>
        </div>
        
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            🔍 Searching the web → 📊 Analyzing results → 🧠 Generating summary...
          </div>
        )}
        
        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
          <strong>🚀 Enhanced Features:</strong> Real-time web search with AI-powered summarization, 
          key insights extraction, and intelligent analysis using llama-3.3-70b-versatile
        </div>
      </CardContent>
    </Card>
  );
};
