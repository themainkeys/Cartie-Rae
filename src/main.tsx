import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from './context/AppContext';
import { AppContent } from './App';
import './index.css';

const rootEl = document.getElementById('root');

if (rootEl) {
  createRoot(rootEl).render(
    <React.StrictMode>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </React.StrictMode>
  );
}
