
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Loader2 } from 'lucide-react';
import { webSearchService } from '@/services/webSearchService';
import { toast } from "sonner";

interface AISearchToolProps {
  onSendToChat: (message: string) => void;
}

export const AISearchTool: React.FC<AISearchToolProps> = ({ onSendToChat }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    try {
      const result = await webSearchService.search(query);
      setLastResult(result);
      onSendToChat(`🔍 **Search Results for "${query}":**\n\n${result}`);
      toast.success('Search completed');
      setQuery('');
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching) {
      handleSearch();
    }
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>AI Web Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Search the web (e.g., 'benefits of magnesium', 'weather in London')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSearching}
            />
            <Button onClick={handleSearch} disabled={!query.trim() || isSearching}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Get real-time information from the web with AI-powered summaries
          </div>
          
          {lastResult && (
            <Card className="bg-gray-50 dark:bg-gray-800">
              <CardContent className="p-3">
                <h4 className="font-medium mb-2">Latest Search Result:</h4>
                <p className="text-sm whitespace-pre-wrap">{lastResult.substring(0, 200)}...</p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
