
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Youtube, 
  FileText, 
  Lightbulb, 
  Calculator, 
  Wand2, 
  MessageSquare, 
  Mic, 
  Volume2, 
  FileSearch,
  StickyNote,
  Zap,
  Palette,
  Users,
  BookOpen,
  Target,
  Globe,
  Sparkles,
  RotateCcw,
  Eye
} from 'lucide-react';

interface ToolkitSidebarProps {
  selectedTool: string | null;
  onToolSelect: (toolId: string) => void;
}

const tools = [
  {
    id: 'ai-search',
    name: 'AI Search',
    description: 'Search the web with AI-powered summaries',
    icon: Search,
    category: 'Search & Discovery',
    available: true
  },
  {
    id: 'youtube-summary',
    name: 'YouTube Summary',
    description: 'Summarize YouTube videos instantly',
    icon: Youtube,
    category: 'Content Analysis',
    available: true
  },
  {
    id: 'chatpdf',
    name: 'Chat PDF',
    description: 'Upload and chat with PDF documents',
    icon: FileText,
    category: 'Document Analysis',
    available: true
  },
  {
    id: 'ai-solver',
    name: 'AI Solver',
    description: 'Solve complex problems step-by-step',
    icon: Calculator,
    category: 'Problem Solving',
    available: true
  },
  {
    id: 'make-it-more',
    name: 'Make It More',
    description: 'Enhance and expand your content',
    icon: Wand2,
    category: 'Content Enhancement',
    available: true
  },
  {
    id: 'live-voice',
    name: 'Live Voice',
    description: 'Real-time voice conversations',
    icon: Mic,
    category: 'Voice & Audio',
    available: true
  },
  {
    id: 'voice',
    name: 'Voice',
    description: 'Text-to-speech conversion',
    icon: Volume2,
    category: 'Voice & Audio',
    available: true
  },
  {
    id: 'web-summary',
    name: 'Web Summary',
    description: 'Summarize any webpage content',
    icon: Globe,
    category: 'Content Analysis',
    available: true
  },
  {
    id: 'interpreting',
    name: 'Interpreting',
    description: 'Analyze and interpret complex data',
    icon: Eye,
    category: 'Analysis',
    available: true
  },
  {
    id: 'web-chat',
    name: 'Web Chat',
    description: 'Chat about any webpage',
    icon: MessageSquare,
    category: 'Interactive Analysis',
    available: true
  },
  {
    id: 'memo',
    name: 'Memo',
    description: 'Quick notes and reminders',
    icon: StickyNote,
    category: 'Productivity',
    available: true
  },
  {
    id: 'ai-detector',
    name: 'AI Detector',
    description: 'Detect AI-generated content',
    icon: Zap,
    category: 'Analysis',
    available: true
  },
  {
    id: 'craft-artifacts',
    name: 'Craft Artifacts',
    description: 'Create interactive content',
    icon: Palette,
    category: 'Creative Tools',
    available: true
  },
  {
    id: 'clone',
    name: 'Clone',
    description: 'Create AI personality clones',
    icon: Users,
    category: 'AI Personalities',
    available: true
  },
  {
    id: 'flashcards',
    name: 'Flashcards',
    description: 'Generate study flashcards',
    icon: BookOpen,
    category: 'Education',
    available: true
  },
  {
    id: 'mind-map',
    name: 'Mind Map',
    description: 'Visual idea mapping',
    icon: Target,
    category: 'Visualization',
    available: true
  },
  {
    id: 'humanize',
    name: 'Humanize',
    description: 'Make AI text more natural',
    icon: Sparkles,
    category: 'Content Enhancement',
    available: true
  },
  {
    id: 'roast-master',
    name: 'Roast Master',
    description: 'Humorous content critique',
    icon: RotateCcw,
    category: 'Entertainment',
    available: true
  }
];

const categories = Array.from(new Set(tools.map(tool => tool.category)));

export const ToolkitSidebar: React.FC<ToolkitSidebarProps> = ({
  selectedTool,
  onToolSelect
}) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">AI Toolkit</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="p-4 space-y-6">
            {categories.map(category => (
              <div key={category}>
                <h3 className="font-semibold text-sm text-muted-foreground mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {tools
                    .filter(tool => tool.category === category)
                    .map(tool => {
                      const IconComponent = tool.icon;
                      return (
                        <div
                          key={tool.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent ${
                            selectedTool === tool.id ? 'bg-accent border-primary' : ''
                          }`}
                          onClick={() => onToolSelect(tool.id)}
                        >
                          <div className="flex items-start gap-3">
                            <IconComponent className="h-5 w-5 mt-0.5 text-primary" />
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{tool.name}</p>
                                {tool.available && (
                                  <Badge variant="secondary" className="text-xs">
                                    Available
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {tool.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
