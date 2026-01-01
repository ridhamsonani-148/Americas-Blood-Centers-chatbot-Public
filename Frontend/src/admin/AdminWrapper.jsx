import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './AdminLogin';
import AdminPage from './AdminPage';
import authService from '../services/authService';

const AdminWrapper = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated using Cognito tokens
    const authenticated = authService.isAuthenticated();
    setIsAuthenticated(authenticated);
    setIsLoading(false);
  }, []);

  const handleLogout = () => {
    authService.signOut();
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      {/* Admin login route */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? 
            <Navigate to="/admin/dashboard" replace /> : 
            <AdminLogin />
        } 
      />
      
      {/* Protected admin dashboard route */}
      <Route 
        path="/dashboard" 
        element={
          isAuthenticated ? 
            <AdminPage onLogout={handleLogout} /> :
            <Navigate to="/admin" replace />
        } 
      />
    </Routes>
  );
};

export default AdminWrapper;