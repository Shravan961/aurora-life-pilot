
import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { FloatingChatButton } from '@/components/chat/FloatingChatButton';
import { ChatModal } from '@/components/chat/ChatModal';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { NutritionTracker } from '@/components/nutrition/NutritionTracker';
import { DailyPlanner } from '@/components/planner/DailyPlanner';
import { WellnessDashboard } from '@/components/wellness/WellnessDashboard';
import { ChatbotPage } from '@/pages/ChatbotPage';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import { useLocalStorage } from '@/hooks/useLocalStorage';

type ActiveTab = 'dashboard' | 'nutrition' | 'planner' | 'wellness' | 'chatbot';

const Index = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [darkMode, setDarkMode] = useLocalStorage('darkMode', false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} />;
      case 'nutrition':
        return <NutritionTracker />;
      case 'planner':
        return <DailyPlanner />;
      case 'wellness':
        return <WellnessDashboard />;
      case 'chatbot':
        return <ChatbotPage onNavigateBack={() => setActiveTab('dashboard')} />;
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  // Don't show the normal layout for chatbot page
  if (activeTab === 'chatbot') {
    return renderActiveComponent();
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950 transition-colors duration-300`}>
      <div className="container mx-auto px-4 pb-20">
        <Header darkMode={darkMode} setDarkMode={setDarkMode} />
        
        <main className="mt-6">
          {renderActiveComponent()}
        </main>

        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        
        <FloatingChatButton onClick={() => setIsChatOpen(true)} />
        
        <ChatModal 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
        />
      </div>
      <Toaster />
    </div>
  );
};

export default Index;
