
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Smile, Frown, Meh, TrendingUp } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from "sonner";

interface MoodEntry {
  id: string;
  mood: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
  note?: string;
  timestamp: number;
}

interface WellnessStats {
  waterIntake: number;
  sleepHours: number;
  exerciseMinutes: number;
  date: string;
}

export const WellnessDashboard: React.FC = () => {
  const [moodEntries, setMoodEntries] = useLocalStorage<MoodEntry[]>('moodEntries', []);
  const [todayStats, setTodayStats] = useLocalStorage<WellnessStats>('todayWellnessStats', {
    waterIntake: 0,
    sleepHours: 0,
    exerciseMinutes: 0,
    date: new Date().toDateString(),
  });

  // Reset stats if it's a new day
  React.useEffect(() => {
    const today = new Date().toDateString();
    if (todayStats.date !== today) {
      setTodayStats({
        waterIntake: 0,
        sleepHours: 0,
        exerciseMinutes: 0,
        date: today,
      });
    }
  }, [todayStats.date, setTodayStats]);

  const logMood = (mood: MoodEntry['mood']) => {
    const newEntry: MoodEntry = {
      id: Date.now().toString(),
      mood,
      timestamp: Date.now(),
    };
    
    setMoodEntries(prev => [newEntry, ...prev.slice(0, 29)]); // Keep last 30 entries
    toast.success('Mood logged successfully!');
  };

  const updateWater = (amount: number) => {
    setTodayStats(prev => ({
      ...prev,
      waterIntake: Math.max(0, prev.waterIntake + amount),
    }));
    if (amount > 0) toast.success('Water intake updated!');
  };

  const updateSleep = (hours: number) => {
    setTodayStats(prev => ({
      ...prev,
      sleepHours: Math.max(0, Math.min(24, hours)),
    }));
    toast.success('Sleep hours updated!');
  };

  const updateExercise = (minutes: number) => {
    setTodayStats(prev => ({
      ...prev,
      exerciseMinutes: Math.max(0, prev.exerciseMinutes + minutes),
    }));
    if (minutes > 0) toast.success('Exercise logged!');
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'great': case 'good': return <Smile className="h-6 w-6 text-green-500" />;
      case 'okay': return <Meh className="h-6 w-6 text-yellow-500" />;
      case 'bad': case 'terrible': return <Frown className="h-6 w-6 text-red-500" />;
      default: return <Meh className="h-6 w-6 text-gray-500" />;
    }
  };

  const getRecentMoodAverage = () => {
    if (moodEntries.length === 0) return 0;
    
    const moodValues = { terrible: 1, bad: 2, okay: 3, good: 4, great: 5 };
    const recentEntries = moodEntries.slice(0, 7); // Last 7 entries
    const average = recentEntries.reduce((sum, entry) => sum + moodValues[entry.mood], 0) / recentEntries.length;
    
    return Math.round(average * 10) / 10;
  };

  const wellnessTips = [
    "Stay hydrated! Aim for 8 glasses of water daily.",
    "Take a 5-minute break every hour to stretch.",
    "Practice deep breathing when feeling stressed.",
    "Get 7-9 hours of quality sleep each night.",
    "Spend time in nature to boost your mood.",
  ];

  const randomTip = wellnessTips[Math.floor(Math.random() * wellnessTips.length)];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Wellness Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Track your wellbeing and build healthy habits
        </p>
      </div>

      {/* Mood Tracking */}
      <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5" />
            <span>How are you feeling today?</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {(['terrible', 'bad', 'okay', 'good', 'great'] as const).map((mood) => (
              <Button
                key={mood}
                variant="outline"
                onClick={() => logMood(mood)}
                className="h-16 flex flex-col items-center justify-center space-y-1 hover:scale-105 transition-transform"
              >
                {getMoodIcon(mood)}
                <span className="text-xs capitalize">{mood}</span>
              </Button>
            ))}
          </div>
          
          {moodEntries.length > 0 && (
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Recent average: {getRecentMoodAverage()}/5 
                <TrendingUp className="inline h-4 w-4 ml-1" />
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Water Intake */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Water Intake</h3>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {todayStats.waterIntake} glasses
            </div>
            <div className="flex space-x-1">
              <Button size="sm" onClick={() => updateWater(1)} variant="outline">+1</Button>
              <Button size="sm" onClick={() => updateWater(-1)} variant="outline">-1</Button>
            </div>
          </CardContent>
        </Card>

        {/* Sleep */}
        <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Sleep</h3>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              {todayStats.sleepHours}h
            </div>
            <div className="flex space-x-1">
              <Button size="sm" onClick={() => updateSleep(todayStats.sleepHours + 0.5)} variant="outline">+0.5h</Button>
              <Button size="sm" onClick={() => updateSleep(todayStats.sleepHours - 0.5)} variant="outline">-0.5h</Button>
            </div>
          </CardContent>
        </Card>

        {/* Exercise */}
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">Exercise</h3>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
              {todayStats.exerciseMinutes}min
            </div>
            <div className="flex space-x-1">
              <Button size="sm" onClick={() => updateExercise(15)} variant="outline">+15m</Button>
              <Button size="sm" onClick={() => updateExercise(30)} variant="outline">+30m</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wellness Tip */}
      <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">💡 Wellness Tip</h3>
          <p className="text-indigo-100">{randomTip}</p>
        </CardContent>
      </Card>

      {/* Recent Mood History */}
      {moodEntries.length > 0 && (
        <Card className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Recent Mood Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {moodEntries.slice(0, 5).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-2 bg-white/50 dark:bg-gray-700/50 rounded">
                  <div className="flex items-center space-x-2">
                    {getMoodIcon(entry.mood)}
                    <span className="capitalize">{entry.mood}</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
