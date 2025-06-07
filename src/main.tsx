/// <reference types="react" />
/// <reference types="react-dom" />

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

const app = (
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

ReactDOM.createRoot(root).render(app);
