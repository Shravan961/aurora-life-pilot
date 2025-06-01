
import React from 'react';
import { PlaceholderTool } from './PlaceholderTool';

interface ChatPDFToolProps {
  onSendToChat: (message: string) => void;
}

export const ChatPDFTool: React.FC<ChatPDFToolProps> = ({ onSendToChat }) => {
  return (
    <PlaceholderTool
      toolName="ChatPDF"
      description="Upload PDFs and have AI-powered conversations about their content."
      onSendToChat={onSendToChat}
    />
  );
};
