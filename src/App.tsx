/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PreferencesProvider } from './contexts/PreferencesContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Scan from './pages/Scan';
import Insights from './pages/Insights';
import ReceiptDetail from './pages/ReceiptDetail';
import Profile from './pages/Profile';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <PreferencesProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            
            <Route path="/scan" element={
              <PrivateRoute>
                <Scan />
              </PrivateRoute>
            } />
            
            <Route path="/insights" element={
              <PrivateRoute>
                <Insights />
              </PrivateRoute>
            } />
            
            <Route path="/receipt/:id" element={
              <PrivateRoute>
                <ReceiptDetail />
              </PrivateRoute>
            } />

            <Route path="/profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
          </Routes>
        </BrowserRouter>
      </PreferencesProvider>
    </ErrorBoundary>
  );
}
