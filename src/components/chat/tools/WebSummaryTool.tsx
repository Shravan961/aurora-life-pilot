
import React from 'react';
import { PlaceholderTool } from './PlaceholderTool';

interface WebSummaryToolProps {
  onSendToChat: (message: string) => void;
}

export const WebSummaryTool: React.FC<WebSummaryToolProps> = ({ onSendToChat }) => {
  return (
    <PlaceholderTool
      toolName="Web Summary"
      description="Summarize web pages from their URLs."
      onSendToChat={onSendToChat}
    />
  );
};
