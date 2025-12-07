// src/routes/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../state/UserContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useUser();
  const location = useLocation();

  if (loading) return <div className="p-6">Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  // If the user is a student and their account is pending, redirect them
  // to the pending verification page.
  if (user.role === 'STUDENT' && user.status === 'pending' && location.pathname !== '/pending-verification') {
    return <Navigate to="/pending-verification" state={{ from: location }} replace />;
  }

  return children;
}