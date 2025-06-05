
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Crown, MessageSquare, Zap, Camera, Heart, AlertCircle, CheckSquare } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

interface UsageDisplayProps {
  onUpgradeClick: () => void;
}

export const UsageDisplay: React.FC<UsageDisplayProps> = ({ onUpgradeClick }) => {
  const { subscription, usage, isSubscribed, getRemainingUsage } = useSubscription();

  const usageItems = [
    {
      icon: MessageSquare,
      label: 'Messages',
      used: usage.messages_used,
      limit: 5,
      remaining: getRemainingUsage('messages_used'),
    },
    {
      icon: Zap,
      label: 'Functions',
      used: usage.functions_used,
      limit: 5,
      remaining: getRemainingUsage('functions_used'),
    },
    {
      icon: Camera,
      label: 'Food Logs',
      used: usage.food_logs_used,
      limit: 1,
      remaining: getRemainingUsage('food_logs_used'),
    },
    {
      icon: AlertCircle,
      label: 'Symptom Logs',
      used: usage.symptom_logs_used,
      limit: 1,
      remaining: getRemainingUsage('symptom_logs_used'),
    },
    {
      icon: Heart,
      label: 'Mood Logs',
      used: usage.mood_logs_used,
      limit: 1,
      remaining: getRemainingUsage('mood_logs_used'),
    },
    {
      icon: CheckSquare,
      label: 'Tasks',
      used: usage.tasks_used,
      limit: 1,
      remaining: getRemainingUsage('tasks_used'),
    },
  ];

  if (isSubscribed) {
    return (
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Premium Active
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You have unlimited access to all features!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Usage Limits</span>
          <Button size="sm" onClick={onUpgradeClick} className="bg-gradient-to-r from-indigo-500 to-purple-600">
            <Crown className="h-4 w-4 mr-1" />
            Upgrade
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {usageItems.map((item, index) => {
          const Icon = item.icon;
          const percentage = (item.used / item.limit) * 100;
          const isAtLimit = item.used >= item.limit;
          
          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <span className={`text-sm ${isAtLimit ? 'text-red-500' : 'text-gray-600'}`}>
                  {item.used}/{item.limit}
                </span>
              </div>
              <Progress 
                value={percentage} 
                className={`h-2 ${isAtLimit ? '[&>div]:bg-red-500' : ''}`}
              />
              <div className="text-xs text-gray-500">
                {item.remaining > 0 ? `${item.remaining} remaining` : 'Limit reached'}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
