
import React from 'react';
import { PlaceholderTool } from './PlaceholderTool';

interface InterpretingToolProps {
  onSendToChat: (message: string) => void;
}

export const InterpretingTool: React.FC<InterpretingToolProps> = ({ onSendToChat }) => {
  return (
    <PlaceholderTool
      toolName="Interpreting"
      description="Translate text and interpret foreign language content."
      onSendToChat={onSendToChat}
    />
  );
};
