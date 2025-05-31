
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Apple, Calendar, Heart, TrendingUp, Zap } from 'lucide-react';
import { useLocalNutrition } from '@/hooks/useLocalNutrition';
import { useLocalTasks } from '@/hooks/useLocalTasks';
import { useLocalMood } from '@/hooks/useLocalMood';

type ActiveTab = 'dashboard' | 'nutrition' | 'planner' | 'wellness' | 'chatbot';

interface DashboardProps {
  onNavigate: (tab: ActiveTab) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { getTodaysCalories } = useLocalNutrition();
  const { getTodaysCompletedCount, getTodaysTotalCount } = useLocalTasks();
  const { getTodaysMoodScore } = useLocalMood();

  const todaysCalories = getTodaysCalories();
  const completedTasks = getTodaysCompletedCount();
  const totalTasks = getTodaysTotalCount();
  const moodScore = getTodaysMoodScore();

  const quickActions = [
    {
      id: 'nutrition',
      title: 'Log Meal',
      description: 'Track your nutrition',
      icon: Apple,
      color: 'from-green-500 to-emerald-600',
    },
    {
      id: 'planner',
      title: 'Add Task',
      description: 'Plan your day',
      icon: Calendar,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      id: 'wellness',
      title: 'Mood Check',
      description: 'Track wellbeing',
      icon: Heart,
      color: 'from-pink-500 to-rose-600',
    },
  ];

  const stats = [
    { 
      label: 'Today\'s Calories', 
      value: todaysCalories > 0 ? todaysCalories.toString() : '0', 
      trend: todaysCalories > 0 ? '+' + todaysCalories : '—', 
      icon: TrendingUp 
    },
    { 
      label: 'Tasks Completed', 
      value: `${completedTasks}/${totalTasks}`, 
      trend: totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}%` : '—', 
      icon: Zap 
    },
    { 
      label: 'Mood Score', 
      value: moodScore !== null ? `${moodScore}/10` : '—', 
      trend: moodScore !== null ? (moodScore >= 7 ? 'Good' : moodScore >= 4 ? 'Fair' : 'Low') : 'No data', 
      icon: Heart 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="text-center py-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to Aurafy
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Your AI Life Co-Pilot is ready to help
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    <p className="text-sm text-green-600 dark:text-green-400">{stat.trend}</p>
                  </div>
                  <Icon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant="outline"
                className="h-auto p-0 overflow-hidden group hover:scale-105 transition-transform"
                onClick={() => onNavigate(action.id as ActiveTab)}
              >
                <div className="w-full p-6 text-left">
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${action.color} mb-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {action.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {action.description}
                  </p>
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      {/* AI Assistant Prompt */}
      <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <MessageSquare className="h-8 w-8" />
            <div>
              <h3 className="font-semibold">Need help with anything?</h3>
              <p className="text-indigo-100">Ask your AI assistant - I'm here to help!</p>
            </div>
            <Button 
              variant="secondary" 
              onClick={() => onNavigate('chatbot')}
              className="ml-auto"
            >
              Chat Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
