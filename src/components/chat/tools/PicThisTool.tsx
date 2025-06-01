
import React from 'react';
import { PlaceholderTool } from './PlaceholderTool';

interface PicThisToolProps {
  onSendToChat: (message: string) => void;
}

export const PicThisTool: React.FC<PicThisToolProps> = ({ onSendToChat }) => {
  return (
    <PlaceholderTool
      toolName="Pic-This"
      description="Upload images for AI analysis and interpretation."
      onSendToChat={onSendToChat}
    />
  );
};
