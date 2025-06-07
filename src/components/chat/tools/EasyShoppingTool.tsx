
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, ShoppingCart, ExternalLink } from 'lucide-react';
import { toast } from "sonner";

interface Product {
  name: string;
  price: string;
  store: string;
  url: string;
  rating?: string;
  image?: string;
  description?: string;
}

interface EasyShoppingToolProps {
  onSendToChat: (message: string) => void;
}

export const EasyShoppingTool: React.FC<EasyShoppingToolProps> = ({ onSendToChat }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  const searchProducts = async () => {
    if (!query.trim()) {
      toast.error('Please enter a product to search for');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call with mock data for now
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockProducts: Product[] = [
        {
          name: `${query} - Premium Quality`,
          price: '$29.99',
          store: 'Amazon',
          url: `https://www.amazon.com/s?k=${encodeURIComponent(query)}`,
          rating: '4.5/5',
          description: 'High-quality product with excellent reviews and fast shipping.',
          image: '/placeholder.svg'
        },
        {
          name: `${query} - Best Value`,
          price: '$19.99',
          store: 'Walmart',
          url: `https://www.walmart.com/search?q=${encodeURIComponent(query)}`,
          rating: '4.2/5',
          description: 'Great value for money with reliable quality.',
          image: '/placeholder.svg'
        },
        {
          name: `${query} - Professional Grade`,
          price: '$49.99',
          store: 'Best Buy',
          url: `https://www.bestbuy.com/site/searchpage.jsp?st=${encodeURIComponent(query)}`,
          rating: '4.7/5',
          description: 'Professional-grade quality with extended warranty.',
          image: '/placeholder.svg'
        },
        {
          name: `${query} - Eco-Friendly`,
          price: '$35.99',
          store: 'Target',
          url: `https://www.target.com/s?searchTerm=${encodeURIComponent(query)}`,
          rating: '4.3/5',
          description: 'Environmentally conscious choice with sustainable materials.',
          image: '/placeholder.svg'
        }
      ];

      setProducts(mockProducts);
      
      const summary = `Found ${mockProducts.length} products for "${query}". Price range: ${Math.min(...mockProducts.map(p => parseFloat(p.price.replace('$', ''))))} - ${Math.max(...mockProducts.map(p => parseFloat(p.price.replace('$', ''))))}. Available at Amazon, Walmart, Best Buy, and Target.`;
      onSendToChat(summary);
      
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchProducts();
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-2 mb-4">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Easy Shopping</h2>
        </div>
        
        <div className="flex space-x-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search for any product..."
            className="flex-1"
            disabled={loading}
          />
          <Button 
            onClick={searchProducts} 
            disabled={loading || !query.trim()}
            className="px-6"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {products.length > 0 ? (
          <div className="h-full overflow-y-auto p-4">
            <div className="grid gap-4">
              {products.map((product, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {product.image && (
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-20 h-20 object-cover rounded-md bg-muted"
                        />
                      )}
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-foreground line-clamp-2">
                            {product.name}
                          </h3>
                          <Badge variant="secondary" className="ml-2 shrink-0">
                            {product.store}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="font-bold text-lg text-primary">{product.price}</span>
                          {product.rating && (
                            <span className="flex items-center">
                              ⭐ {product.rating}
                            </span>
                          )}
                        </div>
                        
                        {product.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {product.description}
                          </p>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => {
                            window.open(product.url, '_blank');
                            onSendToChat(`Opened ${product.store} link for "${product.name}" - ${product.price}`);
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View on {product.store}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div className="space-y-3">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <h3 className="text-lg font-medium text-foreground">Search for Products</h3>
              <p className="text-muted-foreground max-w-sm">
                Enter any product name to find the best deals across multiple stores
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
