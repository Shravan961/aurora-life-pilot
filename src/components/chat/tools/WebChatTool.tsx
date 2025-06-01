
import React from 'react';
import { PlaceholderTool } from './PlaceholderTool';

interface WebChatToolProps {
  onSendToChat: (message: string) => void;
}

export const WebChatTool: React.FC<WebChatToolProps> = ({ onSendToChat }) => {
  return (
    <PlaceholderTool
      toolName="Web Chat"
      description="Chat with web pages and ask questions about their content."
      onSendToChat={onSendToChat}
    />
  );
};
