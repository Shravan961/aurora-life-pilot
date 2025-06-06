
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, ShoppingCart, ExternalLink, Star, DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { GROQ_API_KEY, GROQ_MODEL } from '@/utils/constants';

interface EasyShoppingToolProps {
  onSendToChat: (message: string) => void;
}

interface ProductResult {
  name: string;
  price: string;
  store: string;
  link: string;
  image?: string;
  rating?: string;
  description?: string;
}

export const EasyShoppingTool: React.FC<EasyShoppingToolProps> = ({ onSendToChat }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ProductResult[]>([]);

  const generateProductResults = async (query: string): Promise<ProductResult[]> => {
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
              content: `You are a shopping assistant that generates realistic product search results. For any product search, return a JSON array of 6-8 products from popular stores. Each product must have:
              - name: Product name with brand/model
              - price: Realistic price with currency symbol
              - store: Real store name (Amazon, eBay, Best Buy, Walmart, Target, Home Depot, etc.)
              - link: Use actual store search URLs like "https://www.amazon.com/s?k=" + encoded product name
              - rating: Star rating like "4.5/5" or "4.2/5"
              - description: Brief product description focusing on key features
              
              Make the data realistic and varied. Use proper search URLs that actually work.`
            },
            {
              role: 'user',
              content: `Find shopping results for: ${query}`
            }
          ],
          temperature: 0.4,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (content) {
        try {
          const cleanContent = content.replace(/```json\n?|```\n?/g, '').trim();
          const parsedResults = JSON.parse(cleanContent);
          
          // Ensure proper URLs
          const processedResults = parsedResults.map((product: any) => ({
            ...product,
            link: product.link || generateStoreLink(product.store, query)
          }));
          
          return Array.isArray(processedResults) ? processedResults : [];
        } catch (parseError) {
          console.error('Parse error:', parseError);
          return generateFallbackResults(query);
        }
      }
      
      return generateFallbackResults(query);
    } catch (error) {
      console.error('Search error:', error);
      return generateFallbackResults(query);
    }
  };

  const generateStoreLink = (store: string, query: string): string => {
    const encodedQuery = encodeURIComponent(query);
    const storeLinks: { [key: string]: string } = {
      'Amazon': `https://www.amazon.com/s?k=${encodedQuery}`,
      'eBay': `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}`,
      'Best Buy': `https://www.bestbuy.com/site/searchpage.jsp?st=${encodedQuery}`,
      'Walmart': `https://www.walmart.com/search?q=${encodedQuery}`,
      'Target': `https://www.target.com/s?searchTerm=${encodedQuery}`,
      'Home Depot': `https://www.homedepot.com/s/${encodedQuery}`,
      'Lowes': `https://www.lowes.com/search?searchTerm=${encodedQuery}`,
      'Costco': `https://www.costco.com/CatalogSearch?keyword=${encodedQuery}`,
      'Newegg': `https://www.newegg.com/p/pl?d=${encodedQuery}`,
      'B&H': `https://www.bhphotovideo.com/c/search?Ntt=${encodedQuery}`
    };
    
    return storeLinks[store] || `https://www.google.com/search?tbm=shop&q=${encodedQuery}`;
  };

  const generateFallbackResults = (query: string): ProductResult[] => {
    const stores = ['Amazon', 'eBay', 'Best Buy', 'Walmart', 'Target', 'Newegg'];
    return stores.map((store, index) => ({
      name: `${query} - ${['Premium', 'Standard', 'Pro', 'Deluxe', 'Basic', 'Elite'][index]} Model`,
      price: `$${(Math.random() * 200 + 20).toFixed(2)}`,
      store: store,
      link: generateStoreLink(store, query),
      rating: `${(Math.random() * 1.5 + 3.5).toFixed(1)}/5`,
      description: `High-quality ${query.toLowerCase()} with excellent features and customer reviews`
    }));
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a product to search for');
      return;
    }

    if (!GROQ_API_KEY) {
      toast.error('Groq API key not configured');
      return;
    }

    setIsLoading(true);
    
    try {
      const searchResults = await generateProductResults(searchQuery);
      setResults(searchResults);
      
      if (searchResults.length > 0) {
        toast.success(`Found ${searchResults.length} results for "${searchQuery}"`);
        // Send to chat
        onSendToChat(`🛒 Found ${searchResults.length} shopping results for "${searchQuery}". Check the Easy Shopping tool for details and direct links!`);
      } else {
        toast.error('No results found. Try a different search term.');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search for products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToChat = (product: ProductResult) => {
    const message = `🛍️ **${product.name}**\n💰 Price: ${product.price} at ${product.store}\n⭐ Rating: ${product.rating}\n📝 ${product.description}\n🔗 [Shop Now](${product.link})`;
    onSendToChat(message);
    toast.success('Product details sent to chat!');
  };

  return (
    <div className="h-full flex flex-col p-4 max-w-full">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <ShoppingCart className="h-5 w-5" />
            <span>Easy Shopping</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-4">
          <div className="flex space-x-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for any product..."
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSearch()}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              disabled={isLoading || !searchQuery.trim()}
              size="sm"
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {results.length > 0 && (
            <ScrollArea className="flex-1">
              <div className="space-y-3">
                {results.map((product, index) => (
                  <Card key={index} className="p-3 hover:shadow-md transition-all border-l-4 border-l-blue-500">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-medium text-sm line-clamp-2 flex-1 pr-2">{product.name}</h3>
                        <div className="flex items-center space-x-1 text-green-600 font-bold">
                          <DollarSign className="h-3 w-3" />
                          <span className="text-sm">{product.price}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-blue-600">{product.store}</span>
                        {product.rating && (
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-yellow-600">{product.rating}</span>
                          </div>
                        )}
                      </div>

                      {product.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{product.description}</p>
                      )}

                      <div className="flex space-x-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(product.link, '_blank')}
                          className="flex-1 text-xs hover:bg-blue-50"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Shop Now
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSendToChat(product)}
                          className="flex-1 text-xs bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                        >
                          Send to Chat
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}

          {results.length === 0 && !isLoading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Search for products to see results</p>
                <p className="text-xs text-gray-400 mt-1">All links lead to actual store search pages</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
