import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { CompanyProvider } from '@/contexts/CompanyContext';
import '@/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    <BrowserRouter>
      <AuthProvider>
        <CompanyProvider>
          <App />
        </CompanyProvider>
      </AuthProvider>
    </BrowserRouter>
  </>
);