
import React from 'react';
import { PlaceholderTool } from './PlaceholderTool';

interface MindMapToolProps {
  onSendToChat: (message: string) => void;
}

export const MindMapTool: React.FC<MindMapToolProps> = ({ onSendToChat }) => {
  return (
    <PlaceholderTool
      toolName="Mind Map"
      description="Create visual mind maps from your ideas and topics."
      onSendToChat={onSendToChat}
    />
  );
};
