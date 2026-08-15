import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './contexts/ToastContext';
import { AppProvider } from './contexts/AppContext';

// Styles
import './styles/variables.css';
import './styles/global.css';
import './styles/auth.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/dashboard.css';
import './styles/clients.css';
import './styles/wallet.css';
import './styles/stats.css';
import './styles/settings.css';
import './styles/modal.css';
import './styles/toast.css';
import './styles/responsive.css';
import './styles/admin.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
