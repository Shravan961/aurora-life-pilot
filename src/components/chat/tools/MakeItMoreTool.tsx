
import React from 'react';
import { PlaceholderTool } from './PlaceholderTool';

interface MakeItMoreToolProps {
  onSendToChat: (message: string) => void;
}

export const MakeItMoreTool: React.FC<MakeItMoreToolProps> = ({ onSendToChat }) => {
  return (
    <PlaceholderTool
      toolName="Make It More"
      description="Enhance and expand text with additional details and examples."
      onSendToChat={onSendToChat}
    />
  );
};
