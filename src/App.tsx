
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Index from '@/pages/Index';
import { ChatbotPage } from '@/pages/ChatbotPage';
import { InteractiveMindMapPage } from '@/pages/InteractiveMindMapPage';
import NotFound from '@/pages/NotFound';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'chat' | 'mindmap'>('dashboard');
  const [mindMapData, setMindMapData] = useState<any>(null);

  useEffect(() => {
    // Listen for interactive mind map events
    const handleOpenMindMap = (event: any) => {
      setMindMapData(event.detail);
      setCurrentPage('mindmap');
    };

    window.addEventListener('openInteractiveMindMap', handleOpenMindMap);
    return () => window.removeEventListener('openInteractiveMindMap', handleOpenMindMap);
  }, []);

  const navigateTo = (page: 'dashboard' | 'chat' | 'mindmap') => {
    setCurrentPage(page);
  };

  const navigateBack = () => {
    setCurrentPage('dashboard');
  };

  if (currentPage === 'chat') {
    return <ChatbotPage onNavigateBack={navigateBack} />;
  }

  if (currentPage === 'mindmap') {
    return (
      <InteractiveMindMapPage 
        onNavigateBack={navigateBack}
        initialTopic={mindMapData?.topic}
        initialNodes={mindMapData?.nodes}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Index onNavigateToChat={() => navigateTo('chat')} />
      <Toaster />
    </div>
  );
}

export default App;
