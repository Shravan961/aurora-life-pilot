import React from 'react';
import { X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { AISearchTool } from './tools/AISearchTool';
import { YouTubeSummaryTool } from './tools/YouTubeSummaryTool';
import { WebSummaryTool } from './tools/WebSummaryTool';
import { MakeItMoreTool } from './tools/MakeItMoreTool';
import { RoastMasterTool } from './tools/RoastMasterTool';
import { WebChatTool } from './tools/WebChatTool';
import { AIDetectorTool } from './tools/AIDetectorTool';
import { CloneTool } from './tools/CloneTool';
import { HumanizeTool } from './tools/HumanizeTool';
import { AISolverTool } from './tools/AISolverTool';
import { MemoTool } from './tools/MemoTool';
import { VoiceTool } from './tools/VoiceTool';
import { LiveVoiceTool } from './tools/LiveVoiceTool';
import { CraftArtifactsTool } from './tools/CraftArtifactsTool';
import { ChatPDFTool } from './tools/ChatPDFTool';
import { MindMapTool } from './tools/MindMapTool';
import { BotsTool } from './tools/BotsTool';
import { PicThisTool } from './tools/PicThisTool';
import { InterpretingTool } from './tools/InterpretingTool';

interface ToolkitSidebarProps {
  activeTool: string;
  onClose: () => void;
  onSendToChat: (message: string) => void;
}

export const ToolkitSidebar: React.FC<ToolkitSidebarProps> = ({
  activeTool,
  onClose,
  onSendToChat,
}) => {
  const renderTool = () => {
    switch (activeTool) {
      case 'AI Search':
        return <AISearchTool onSendToChat={onSendToChat} />;
      case 'YouTube Summary':
        return <YouTubeSummaryTool onSendToChat={onSendToChat} />;
      case 'Web Summary':
        return <WebSummaryTool onSendToChat={onSendToChat} />;
      case 'Make It More':
        return <MakeItMoreTool onSendToChat={onSendToChat} />;
      case 'Roast Master':
        return <RoastMasterTool onSendToChat={onSendToChat} />;
      case 'Web Chat':
        return <WebChatTool onSendToChat={onSendToChat} />;
      case 'AI Detector':
        return <AIDetectorTool onSendToChat={onSendToChat} />;
      case 'Clone':
        return <CloneTool onSendToChat={onSendToChat} />;
      case 'Humanize':
        return <HumanizeTool onSendToChat={onSendToChat} />;
      case 'AI Solver':
        return <AISolverTool onSendToChat={onSendToChat} />;
      case 'Memo':
        return <MemoTool onSendToChat={onSendToChat} />;
      case 'Voice':
        return <VoiceTool onSendToChat={onSendToChat} />;
      case 'Live Voice':
        return <LiveVoiceTool onSendToChat={onSendToChat} />;
      case 'Craft Artifacts':
        return <CraftArtifactsTool onSendToChat={onSendToChat} />;
      case 'ChatPDF':
        return <ChatPDFTool onSendToChat={onSendToChat} />;
      case 'Mind Map':
        return <MindMapTool onSendToChat={onSendToChat} />;
      case 'Bots':
        return <BotsTool onSendToChat={onSendToChat} />;
      case 'Pic-This':
        return <PicThisTool onSendToChat={onSendToChat} />;
      case 'Interpreting':
        return <InterpretingTool onSendToChat={onSendToChat} />;
      default:
        return (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">{activeTool}</h3>
            <p className="text-gray-600 dark:text-gray-400">
              This tool is not yet implemented.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold">{activeTool}</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {renderTool()}
      </div>
    </div>
  );
};
