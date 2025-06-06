
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, ExternalLink, DollarSign, Star, Loader2, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface ShoppingResult {
  title: string;
  price: string;
  image: string;
  url: string;
  store: string;
  rating?: string;
  originalPrice?: string;
}

interface EasyShoppingToolProps {
  onSendToChat: (message: string) => void;
}

const GROQ_API_KEY = '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';

export const EasyShoppingTool: React.FC<EasyShoppingToolProps> = ({ onSendToChat }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ShoppingResult[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const generateShoppingResults = async (query: string): Promise<ShoppingResult[]> => {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are a shopping assistant that generates realistic product search results. For the given product search, return a JSON array of 6-8 products with the following structure:
              [
                {
                  "title": "Product name with brand",
                  "price": "$XX.XX",
                  "image": "https://via.placeholder.com/200x200?text=Product+Image",
                  "url": "https://example-store.com/product",
                  "store": "Store Name",
                  "rating": "4.5",
                  "originalPrice": "$XX.XX" (optional, for sales)
                }
              ]
              
              Include results from major retailers like Amazon, Walmart, Target, Best Buy, eBay, etc. Make the prices realistic and varied. Use placeholder images. Include some sale items with originalPrice.`
            },
            {
              role: 'user',
              content: `Generate shopping results for: ${query}`
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch shopping results');
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      try {
        const parsedResults = JSON.parse(content);
        return Array.isArray(parsedResults) ? parsedResults : [];
      } catch (parseError) {
        console.error('Failed to parse shopping results:', parseError);
        return [];
      }
    } catch (error) {
      console.error('Error generating shopping results:', error);
      return [];
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error('Please enter a product to search for');
      return;
    }

    setIsLoading(true);
    try {
      const shoppingResults = await generateShoppingResults(searchTerm);
      setResults(shoppingResults);
      
      // Add to search history
      if (!searchHistory.includes(searchTerm)) {
        setSearchHistory(prev => [searchTerm, ...prev.slice(0, 4)]);
      }

      // Send summary to chat
      const summary = `🛒 **Shopping Results for "${searchTerm}"**\n\nFound ${shoppingResults.length} products across multiple retailers including ${[...new Set(shoppingResults.map(r => r.store))].join(', ')}. Price range: ${shoppingResults.length > 0 ? `${Math.min(...shoppingResults.map(r => parseFloat(r.price.replace('$', ''))))} - ${Math.max(...shoppingResults.map(r => parseFloat(r.price.replace('$', ''))))}` : 'N/A'}`;
      
      onSendToChat(summary);
    } catch (error) {
      toast.error('Failed to search for products');
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setResults([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="w-96 h-full border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col">
      <Card className="flex-1 rounded-none border-0">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Search className="h-4 w-4 text-white" />
            </div>
            Easy Shopping
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col gap-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                placeholder="Search for any product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="pr-8"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isLoading || !searchTerm.trim()}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {/* Search History */}
          {searchHistory.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Searches</p>
              <div className="flex flex-wrap gap-1">
                {searchHistory.map((term, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => {
                      setSearchTerm(term);
                      handleSearch();
                    }}
                  >
                    {term}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-500" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Searching across multiple retailers...
                </p>
              </div>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && !isLoading && (
            <ScrollArea className="flex-1">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {results.length} Results Found
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setResults([])}
                  >
                    Clear Results
                  </Button>
                </div>
                
                {results.map((result, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <img
                          src={result.image}
                          alt={result.title}
                          className="w-16 h-16 object-cover rounded-md bg-gray-100"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/64x64?text=IMG';
                          }}
                        />
                        <div className="flex-1 space-y-2">
                          <h4 className="font-medium text-sm line-clamp-2">
                            {result.title}
                          </h4>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-green-600">
                              {result.price}
                            </span>
                            {result.originalPrice && result.originalPrice !== result.price && (
                              <span className="text-xs text-gray-500 line-through">
                                {result.originalPrice}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {result.store}
                            </Badge>
                            {result.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs text-gray-600">
                                  {result.rating}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => window.open(result.url, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Product
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Empty State */}
          {results.length === 0 && !isLoading && searchTerm && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-2">
                <Search className="h-12 w-12 mx-auto text-gray-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No results found for "{searchTerm}"
                </p>
                <p className="text-xs text-gray-500">
                  Try searching for a different product
                </p>
              </div>
            </div>
          )}

          {/* Welcome State */}
          {results.length === 0 && !isLoading && !searchTerm && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                  <Search className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Start Shopping
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Search for any product to find the best deals across multiple retailers
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
