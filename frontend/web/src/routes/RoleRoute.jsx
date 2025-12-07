import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../state/UserContext';

export default function RoleRoute({ children, allowedRoles }) {
    const { user, loading } = useUser();

    if (loading) return <div className="p-6">Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;

    if (!allowedRoles.includes(user.role)) {
        // Redirect to home if unauthorized
        return <Navigate to="/" replace />;
    }

    return children;
}
