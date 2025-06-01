
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface AISearchToolProps {
  onSendToChat: (message: string) => void;
}

export const AISearchTool: React.FC<AISearchToolProps> = ({ onSendToChat }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);

  const search = () => {
    if (!query.trim()) return;
    
    // Simple search through localStorage data
    const nutrition = JSON.parse(localStorage.getItem('nutritionEntries') || '[]');
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const memos = JSON.parse(localStorage.getItem('aurafy_memos') || '[]');
    
    const searchResults: string[] = [];
    const lowerQuery = query.toLowerCase();
    
    nutrition.forEach((entry: any) => {
      if (entry.query.toLowerCase().includes(lowerQuery)) {
        searchResults.push(`Nutrition: ${entry.query}`);
      }
    });
    
    tasks.forEach((task: any) => {
      if (task.title.toLowerCase().includes(lowerQuery)) {
        searchResults.push(`Task: ${task.title}`);
      }
    });
    
    memos.forEach((memo: any) => {
      if (memo.title.toLowerCase().includes(lowerQuery) || memo.content.toLowerCase().includes(lowerQuery)) {
        searchResults.push(`Memo: ${memo.title}`);
      }
    });
    
    setResults(searchResults);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex space-x-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your data..."
          onKeyPress={(e) => e.key === 'Enter' && search()}
        />
        <Button onClick={search}>Search</Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Results:</h4>
          {results.map((result, index) => (
            <Card key={index} className="p-2">
              <p className="text-sm">{result}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
