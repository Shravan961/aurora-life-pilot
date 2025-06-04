
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { AISearchTool } from './tools/AISearchTool';
import { YouTubeSummaryTool } from './tools/YouTubeSummaryTool';
import { ChatPDFTool } from './tools/ChatPDFTool';
import { AISolverTool } from './tools/AISolverTool';
import { MakeItMoreTool } from './tools/MakeItMoreTool';
import { LiveVoiceTool } from './tools/LiveVoiceTool';
import { VoiceTool } from './tools/VoiceTool';
import { WebSummaryTool } from './tools/WebSummaryTool';
import { InterpretingTool } from './tools/InterpretingTool';
import { WebChatTool } from './tools/WebChatTool';
import { MemoTool } from './tools/MemoTool';
import { AIDetectorTool } from './tools/AIDetectorTool';
import { CraftArtifactsTool } from './tools/CraftArtifactsTool';
import { CloneTool } from './tools/CloneTool';
import { FlashcardsTool } from './tools/FlashcardsTool';
import { MindMapTool } from './tools/MindMapTool';
import { HumanizeTool } from './tools/HumanizeTool';
import { RoastMasterTool } from './tools/RoastMasterTool';

interface ToolInterfaceProps {
  toolId: string;
  onClose: () => void;
  onSendToChat: (message: string) => void;
}

export const ToolInterface: React.FC<ToolInterfaceProps> = ({
  toolId,
  onClose,
  onSendToChat
}) => {
  const renderTool = () => {
    switch (toolId) {
      case 'ai-search':
        return <AISearchTool onClose={onClose} onSendToChat={onSendToChat} />;
      case 'youtube-summary':
        return <YouTubeSummaryTool onClose={onClose} onSendToChat={onSendToChat} />;
      case 'chatpdf':
        return <ChatPDFTool onClose={onClose} onSendToChat={onSendToChat} />;
      case 'ai-solver':
        return <AISolverTool onClose={onClose} onSendToChat={onSendToChat} />;
      case 'make-it-more':
        return <MakeItMoreTool onClose={onClose} onSendToChat={onSendToChat} />;
      case 'live-voice':
        return <LiveVoiceTool onClose={onClose} onSendToChat={onSendToChat} />;
      case 'voice':
        return <VoiceTool onClose={onClose} onSendToChat={onSendToChat} />;
      case 'web-summary':
        return <WebSummaryTool onClose={onClose} onSendToChat={onSendToChat} />;
      case 'interpreting':
        return <InterpretingTool onClose={onClose} onSendToChat={onSendToChat} />;
      case 'web-chat':
        return <WebChatTool onClose={onClose} onSendToChat={onSendToChat} />;
      case 'memo':
        return <MemoTool onClose={onClose} onSendToChat={onSendToChat} />;
      case 'ai-detector':
        return <AIDetectorTool onClose={onClose} onSendToChat={onSendToChat} />;
      case 'craft-artifacts':
        return <CraftArtifactsTool onClose={onClose} onSendToChat={onSendToChat} />;
      case 'clone':
        return <CloneTool onClose={onClose} onSendToChat={onSendToChat} />;
      case 'flashcards':
        return <FlashcardsTool onClose={onClose} onSendToChat={onSendToChat} />;
      case 'mind-map':
        return <MindMapTool onClose={onClose} onSendToChat={onSendToChat} />;
      case 'humanize':
        return <HumanizeTool onClose={onClose} onSendToChat={onSendToChat} />;
      case 'roast-master':
        return <RoastMasterTool onClose={onClose} onSendToChat={onSendToChat} />;
      default:
        return (
          <div className="p-6 text-center">
            <p className="text-muted-foreground">Tool not found: {toolId}</p>
          </div>
        );
    }
  };

  return (
    <div className="w-80 border-l bg-background">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Tool Interface</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="h-[calc(100vh-8rem)] overflow-y-auto">
        {renderTool()}
      </div>
    </div>
  );
};
