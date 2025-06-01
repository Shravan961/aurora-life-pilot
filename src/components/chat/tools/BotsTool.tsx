
import React from 'react';
import { PlaceholderTool } from './PlaceholderTool';

interface BotsToolProps {
  onSendToChat: (message: string) => void;
}

export const BotsTool: React.FC<BotsToolProps> = ({ onSendToChat }) => {
  return (
    <PlaceholderTool
      toolName="Bots"
      description="Create specialized AI agents with custom goals and personalities."
      onSendToChat={onSendToChat}
    />
  );
};
