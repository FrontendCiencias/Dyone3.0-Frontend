import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import QueryProvider from './app/QueryProvider';
import AppRoutes from './app/AppRoutes';
import './index.css';
import AuthBootstrap from './app/AuthBootstrap';
import { AuthProvider } from './lib/auth';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryProvider>
      <AuthProvider>
        <BrowserRouter>
          <AuthBootstrap>
            <AppRoutes />
          </AuthBootstrap>
        </BrowserRouter>
      </AuthProvider>
    </QueryProvider>
  </React.StrictMode>
);