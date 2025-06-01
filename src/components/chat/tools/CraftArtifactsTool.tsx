
import React from 'react';
import { PlaceholderTool } from './PlaceholderTool';

interface CraftArtifactsToolProps {
  onSendToChat: (message: string) => void;
}

export const CraftArtifactsTool: React.FC<CraftArtifactsToolProps> = ({ onSendToChat }) => {
  return (
    <PlaceholderTool
      toolName="Craft Artifacts"
      description="Generate stories, content, letters, and creative writing."
      onSendToChat={onSendToChat}
    />
  );
};
