
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { webSearchService } from '@/services/webSearchService';

interface AISearchToolProps {
  onSendToChat: (message: string) => void;
}

export const AISearchTool: React.FC<AISearchToolProps> = ({ onSendToChat }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateSummary = async (query: string, searchResults: string): Promise<string> => {
    const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
    
    if (!groqApiKey) {
      throw new Error('Groq API key not configured');
    }

    const prompt = `Please analyze and summarize the following web search results for the query: "${query}"

Search Results:
${searchResults}

Provide a comprehensive summary that:
1. Directly answers the user's query
2. Highlights the most important and reliable information
3. Organizes key points clearly
4. Mentions any conflicting information if present

Format your response in a clear, engaging way with bullet points where appropriate.`;

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
            content: 'You are an expert research assistant who analyzes web search results and provides accurate, well-structured summaries.'
          },
          {
            role: 'user',
            content: prompt
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
      console.log('Searching for:', query);
      
      // Perform web search
      const searchResults = await webSearchService.search(query.trim());
      
      if (!searchResults || searchResults.trim().length === 0) {
        throw new Error('No search results found');
      }

      console.log('Search results obtained, generating summary...');
      
      // Generate AI summary using Groq
      const summary = await generateSummary(query.trim(), searchResults);
      
      // Send to chat
      const message = `🔍 **Search Results for:** "${query}"\n\n${summary}`;
      onSendToChat(message);
      
      // Clear input on success
      setQuery('');
      
      toast({
        title: "Success",
        description: "Search completed successfully!"
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
          AI Search
        </CardTitle>
        <CardDescription>
          Search the web and get AI-powered summaries of the most relevant information
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
            Searching the web and generating summary...
          </div>
        )}
      </CardContent>
    </Card>
  );
};
