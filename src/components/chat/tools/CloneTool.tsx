
import React from 'react';
import { PlaceholderTool } from './PlaceholderTool';

interface CloneToolProps {
  onSendToChat: (message: string) => void;
}

export const CloneTool: React.FC<CloneToolProps> = ({ onSendToChat }) => {
  return (
    <PlaceholderTool
      toolName="Clone"
      description="Create personalized AI assistants with custom personalities and roles."
      onSendToChat={onSendToChat}
    />
  );
};
