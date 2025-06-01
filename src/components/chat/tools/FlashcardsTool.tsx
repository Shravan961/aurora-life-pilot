
import React from 'react';
import { PlaceholderTool } from './PlaceholderTool';

interface FlashcardsToolProps {
  onSendToChat: (message: string) => void;
}

export const FlashcardsTool: React.FC<FlashcardsToolProps> = ({ onSendToChat }) => {
  return (
    <PlaceholderTool
      toolName="Flashcards"
      description="Convert notes and topics into interactive study flashcards."
      onSendToChat={onSendToChat}
    />
  );
};
