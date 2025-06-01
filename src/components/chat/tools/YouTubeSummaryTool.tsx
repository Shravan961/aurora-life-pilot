
import React from 'react';
import { PlaceholderTool } from './PlaceholderTool';

interface YouTubeSummaryToolProps {
  onSendToChat: (message: string) => void;
}

export const YouTubeSummaryTool: React.FC<YouTubeSummaryToolProps> = ({ onSendToChat }) => {
  return (
    <PlaceholderTool
      toolName="YouTube Summary"
      description="Summarize YouTube videos from their URLs."
      onSendToChat={onSendToChat}
    />
  );
};
