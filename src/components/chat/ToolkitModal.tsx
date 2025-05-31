
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Bot, Search, FileText, Mic, Volume2, Copy, Image, Zap, Brain, MessageSquare, Globe, Youtube, Flame, Book, Lightbulb } from 'lucide-react';

interface ToolkitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToolSelect: (tool: string) => void;
}

export const ToolkitModal: React.FC<ToolkitModalProps> = ({ isOpen, onClose, onToolSelect }) => {
  if (!isOpen) return null;

  const tools = [
    { id: 'humanize', name: 'Humanize', icon: MessageSquare, description: 'Make text more natural' },
    { id: 'solver', name: 'AI Solver', icon: Brain, description: 'Solve math & logic problems' },
    { id: 'search', name: 'AI Search', icon: Search, description: 'Search knowledge base' },
    { id: 'memo', name: 'Memo', icon: FileText, description: 'Create quick notes' },
    { id: 'voice-live', name: 'Live Voice', icon: Mic, description: 'Voice to text input' },
    { id: 'voice', name: 'Voice', icon: Volume2, description: 'Text to speech output' },
    { id: 'clone', name: 'Clone', icon: Copy, description: 'Clone conversation' },
    { id: 'artifacts', name: 'Craft Artifacts', icon: Zap, description: 'Generate downloadable content' },
    { id: 'chat-pdf', name: 'ChatPDF', icon: FileText, description: 'Chat with PDF content' },
    { id: 'mindmap', name: 'Mind Map', icon: Brain, description: 'Visual idea organization' },
    { id: 'bots', name: 'Bots', icon: Bot, description: 'Specialized AI assistants' },
    { id: 'pic-this', name: 'Pic-This', icon: Image, description: 'Image analysis & description' },
    { id: 'interpreting', name: 'Interpreting', icon: Zap, description: 'Explain data & JSON' },
    { id: 'ai-detector', name: 'AI Detector', icon: Search, description: 'Detect AI-generated text' },
    { id: 'youtube', name: 'YouTube Summary', icon: Youtube, description: 'Summarize YouTube videos' },
    { id: 'web-summary', name: 'Web Summary', icon: Globe, description: 'Summarize web pages' },
    { id: 'web-chat', name: 'Web Chat', icon: MessageSquare, description: 'Chat about web content' },
    { id: 'make-more', name: 'Make It More', icon: Lightbulb, description: 'Expand & elaborate text' },
    { id: 'roast', name: 'Roast Master', icon: Flame, description: 'Playful comedic roasts' },
    { id: 'flashcards', name: 'Flashcards', icon: Book, description: 'Generate study flashcards' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Aurafy Toolkit
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Button
                  key={tool.id}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center space-y-2 hover:scale-105 transition-transform"
                  onClick={() => onToolSelect(tool.name)}
                >
                  <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  <div className="text-center">
                    <div className="font-medium text-sm">{tool.name}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {tool.description}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Coming Soon:</strong> These powerful AI tools will enhance your Aurafy experience with specialized capabilities for content creation, analysis, and productivity.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
