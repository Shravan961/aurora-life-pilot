
import React from 'react';
import { PlaceholderTool } from './PlaceholderTool';

interface RoastMasterToolProps {
  onSendToChat: (message: string) => void;
}

export const RoastMasterTool: React.FC<RoastMasterToolProps> = ({ onSendToChat }) => {
  return (
    <PlaceholderTool
      toolName="Roast Master"
      description="Get playful, fun roasts of your messages (all in good humor!)."
      onSendToChat={onSendToChat}
    />
  );
};
