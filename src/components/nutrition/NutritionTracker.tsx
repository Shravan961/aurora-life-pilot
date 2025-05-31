
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, TrendingUp } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { nutritionService } from '@/services/nutritionService';
import { toast } from "sonner";

interface NutritionItem {
  name: string;
  calories: number;
  protein_g: number;
  fat_total_g: number;
  carbohydrates_total_g: number;
}

interface NutritionLog {
  id: string;
  query: string;
  items: NutritionItem[];
  timestamp: number;
}

export const NutritionTracker: React.FC = () => {
  const [query, setQuery] = useState('');
  const [currentResult, setCurrentResult] = useState<NutritionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nutritionLogs, setNutritionLogs] = useLocalStorage<NutritionLog[]>('nutritionLogs', []);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const result = await nutritionService.searchNutrition(query);
      setCurrentResult(result);
      
      // Save to logs
      const newLog: NutritionLog = {
        id: Date.now().toString(),
        query: query.trim(),
        items: result,
        timestamp: Date.now(),
      };
      
      setNutritionLogs(prev => [newLog, ...prev.slice(0, 19)]); // Keep last 20 logs
      toast.success('Nutrition information found!');
    } catch (error) {
      console.error('Nutrition search error:', error);
      toast.error('Failed to fetch nutrition data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getTotalCalories = () => {
    return currentResult.reduce((total, item) => total + item.calories, 0);
  };

  const getTotalMacros = () => {
    return currentResult.reduce(
      (totals, item) => ({
        protein: totals.protein + item.protein_g,
        fat: totals.fat + item.fat_total_g,
        carbs: totals.carbs + item.carbohydrates_total_g,
      }),
      { protein: 0, fat: 0, carbs: 0 }
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Nutrition Tracker
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Track your meals and monitor your nutrition
        </p>
      </div>

      {/* Search Section */}
      <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Search Food</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., 1 apple, 2 slices whole wheat bread"
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={!query.trim() || isLoading}>
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Results */}
      {currentResult.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Search Results
          </h3>
          
          {/* Totals Summary */}
          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm opacity-90">Total Calories</p>
                  <p className="text-2xl font-bold">{getTotalCalories()}</p>
                </div>
                <div>
                  <p className="text-sm opacity-90">Protein</p>
                  <p className="text-xl font-semibold">{getTotalMacros().protein.toFixed(1)}g</p>
                </div>
                <div>
                  <p className="text-sm opacity-90">Fat</p>
                  <p className="text-xl font-semibold">{getTotalMacros().fat.toFixed(1)}g</p>
                </div>
                <div>
                  <p className="text-sm opacity-90">Carbs</p>
                  <p className="text-xl font-semibold">{getTotalMacros().carbs.toFixed(1)}g</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Individual Items */}
          <div className="grid gap-3">
            {currentResult.map((item, index) => (
              <Card key={index} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                      {item.name}
                    </h4>
                    <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                      {item.calories} cal
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <span>Protein: {item.protein_g}g</span>
                    <span>Fat: {item.fat_total_g}g</span>
                    <span>Carbs: {item.carbohydrates_total_g}g</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent Logs */}
      {nutritionLogs.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Recent Searches</span>
          </h3>
          
          <div className="space-y-3">
            {nutritionLogs.slice(0, 5).map((log) => (
              <Card key={log.id} className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{log.query}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {new Date(log.timestamp).toLocaleDateString()} - {' '}
                        {log.items.reduce((total, item) => total + item.calories, 0)} calories
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setQuery(log.query);
                        setCurrentResult(log.items);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
