
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Trash2, Edit2 } from 'lucide-react';
import { generateId, formatTime } from '@/utils/helpers';

interface Memo {
  id: string;
  title: string;
  content: string;
  timestamp: number;
}

interface MemoToolProps {
  onSendToChat: (message: string) => void;
}

export const MemoTool: React.FC<MemoToolProps> = ({ onSendToChat }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [memos, setMemos] = useState<Memo[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('aurafy_memos');
    if (stored) {
      setMemos(JSON.parse(stored));
    }
  }, []);

  const saveMemo = () => {
    if (!title.trim() || !content.trim()) return;

    const memo: Memo = {
      id: editingId || generateId(),
      title: title.trim(),
      content: content.trim(),
      timestamp: Date.now(),
    };

    let updatedMemos;
    if (editingId) {
      updatedMemos = memos.map(m => m.id === editingId ? memo : m);
    } else {
      updatedMemos = [memo, ...memos];
    }

    setMemos(updatedMemos);
    localStorage.setItem('aurafy_memos', JSON.stringify(updatedMemos));
    
    setTitle('');
    setContent('');
    setEditingId(null);
  };

  const deleteMemo = (id: string) => {
    const updatedMemos = memos.filter(m => m.id !== id);
    setMemos(updatedMemos);
    localStorage.setItem('aurafy_memos', JSON.stringify(updatedMemos));
  };

  const editMemo = (memo: Memo) => {
    setTitle(memo.title);
    setContent(memo.content);
    setEditingId(memo.id);
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Memo title..."
          className="mb-2"
        />
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your memo here..."
          rows={3}
        />
      </div>

      <Button 
        onClick={saveMemo} 
        disabled={!title.trim() || !content.trim()}
        className="w-full"
      >
        {editingId ? 'Update Memo' : 'Save Memo'}
      </Button>

      <div className="space-y-2">
        <h4 className="font-medium text-gray-900 dark:text-white">Your Memos</h4>
        {memos.length === 0 ? (
          <p className="text-gray-500 text-sm">No memos yet</p>
        ) : (
          memos.map(memo => (
            <Card key={memo.id} className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h5 className="font-medium text-sm">{memo.title}</h5>
                  <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                    {memo.content.substring(0, 100)}...
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    {formatTime(memo.timestamp)}
                  </p>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editMemo(memo)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMemo(memo.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
