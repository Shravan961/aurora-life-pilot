
import React from 'react';
import { Button } from "@/components/ui/button";

interface PlaceholderToolProps {
  toolName: string;
  description: string;
  onSendToChat: (message: string) => void;
}

export const PlaceholderTool: React.FC<PlaceholderToolProps> = ({ 
  toolName, 
  description, 
  onSendToChat 
}) => {
  return (
    <div className="p-4 space-y-4 text-center">
      <div className="text-4xl mb-4">🚧</div>
      <h3 className="text-lg font-semibold">{toolName}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Coming Soon!</strong> This powerful tool is being developed and will be available in a future update.
        </p>
      </div>
      <Button 
        onClick={() => onSendToChat(`I'd like to use the ${toolName} tool when it becomes available.`)}
        variant="outline"
        className="w-full"
      >
        Request Feature
      </Button>
    </div>
  );
};
