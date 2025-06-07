import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

// Lazy load pages for better performance
const Index = React.lazy(() => import('@/pages/Index'));
const SignIn = React.lazy(() => import('@/pages/SignIn'));
const SignUp = React.lazy(() => import('@/pages/SignUp'));
const ChatbotPage = React.lazy(() => import('@/pages/ChatbotPage').then(module => ({ default: module.ChatbotPage })));
const InteractiveMindMapPage = React.lazy(() => import('@/pages/InteractiveMindMapPage').then(module => ({ default: module.InteractiveMindMapPage })));
const NotFound = React.lazy(() => import('@/pages/NotFound'));
const ProtectedRoute = React.lazy(() => import('@/components/ProtectedRoute'));

// Loading component
const LoadingSpinner = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/chat" element={
              <ProtectedRoute>
                <ChatbotPage onNavigateBack={() => window.history.back()} />
              </ProtectedRoute>
            } />
            <Route path="/mindmap" element={
              <ProtectedRoute>
                <InteractiveMindMapPage 
                  onNavigateBack={() => window.history.back()}
                  initialTopic=""
                  initialNodes={[]}
                />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <Toaster richColors position="top-right" />
      </div>
    </Router>
  );
}

export default App;
