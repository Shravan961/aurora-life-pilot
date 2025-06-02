
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search } from 'lucide-react';
import Fuse from 'fuse.js';

interface SearchResult {
  type: string;
  title: string;
  content: string;
  date?: string;
}

interface AISearchToolProps {
  onSendToChat: (message: string) => void;
}

export const AISearchTool: React.FC<AISearchToolProps> = ({ onSendToChat }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const getAllData = (): SearchResult[] => {
    const data: SearchResult[] = [];

    // Get nutrition entries
    const nutrition = JSON.parse(localStorage.getItem('nutritionEntries') || '[]');
    nutrition.forEach((entry: any) => {
      data.push({
        type: 'Nutrition',
        title: entry.query,
        content: `${entry.query} - ${entry.calories} calories`,
        date: new Date(entry.timestamp).toLocaleDateString()
      });
    });

    // Get tasks
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    tasks.forEach((task: any) => {
      data.push({
        type: 'Task',
        title: task.title,
        content: task.description || task.title,
        date: new Date(task.date).toLocaleDateString()
      });
    });

    // Get memos
    const memos = JSON.parse(localStorage.getItem('aurafy_memos') || '[]');
    memos.forEach((memo: any) => {
      data.push({
        type: 'Memo',
        title: memo.title,
        content: memo.content,
        date: new Date(memo.timestamp).toLocaleDateString()
      });
    });

    // Get mood entries
    const moods = JSON.parse(localStorage.getItem('moodEntries') || '[]');
    moods.forEach((mood: any) => {
      data.push({
        type: 'Mood',
        title: `Mood: ${mood.score}/10`,
        content: mood.note || `Mood score: ${mood.score}`,
        date: new Date(mood.date).toLocaleDateString()
      });
    });

    // Get symptoms
    const symptoms = JSON.parse(localStorage.getItem('symptoms') || '[]');
    symptoms.forEach((symptom: any) => {
      data.push({
        type: 'Symptom',
        title: symptom.name,
        content: `${symptom.name} - Severity: ${symptom.severity}`,
        date: new Date(symptom.date).toLocaleDateString()
      });
    });

    return data;
  };

  const searchData = () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    const allData = getAllData();
    
    const fuse = new Fuse(allData, {
      keys: ['title', 'content'],
      threshold: 0.3,
      includeScore: true
    });

    const fuseResults = fuse.search(query);
    const searchResults = fuseResults.map(result => result.item);
    
    setResults(searchResults.slice(0, 10)); // Limit to top 10 results
    setIsSearching(false);
  };

  const sendResultToChat = (result: SearchResult) => {
    const message = `Found in ${result.type}: ${result.title}\n${result.content}${result.date ? `\nDate: ${result.date}` : ''}`;
    onSendToChat(message);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex space-x-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your data... (e.g., 'what did I eat', 'mood yesterday')"
          onKeyPress={(e) => e.key === 'Enter' && searchData()}
        />
        <Button onClick={searchData} disabled={isSearching}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {isSearching && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Searching...</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Search Results:</h4>
          {results.map((result, index) => (
            <Card key={index} className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" 
                  onClick={() => sendResultToChat(result)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                      {result.type}
                    </span>
                    {result.date && (
                      <span className="text-xs text-gray-500">{result.date}</span>
                    )}
                  </div>
                  <h5 className="font-medium text-sm mt-1">{result.title}</h5>
                  <p className="text-gray-600 dark:text-gray-400 text-xs mt-1 line-clamp-2">
                    {result.content}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {results.length === 0 && query && !isSearching && (
        <div className="text-center py-4 text-gray-500">
          No results found for "{query}"
        </div>
      )}
    </div>
  );
};
