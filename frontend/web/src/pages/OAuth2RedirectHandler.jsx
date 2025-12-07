import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '../state/UserContext';
import { authService } from '../services/authService';

export default function OAuth2RedirectHandler() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setUser } = useUser();
    const [error, setError] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');

        if (token) {
            localStorage.setItem('accessToken', token);
            if (refreshToken) {
                localStorage.setItem('refreshToken', refreshToken); // Assuming authService handles this if needed
            }

            // Fetch user details
            authService.getMe()
                .then(user => {
                    setUser(user);
                    navigate('/home', { replace: true });
                })
                .catch(err => {
                    console.error("Failed to fetch user details after OAuth2 login", err);
                    setError("Login failed. Please try again.");
                    setTimeout(() => navigate('/login'), 3000);
                });
        } else {
            setError("No token received.");
            setTimeout(() => navigate('/login'), 3000);
        }
    }, [searchParams, navigate, setUser]);

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen bg-background text-red-500">
                {error}
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center h-screen bg-background">
            <div className="text-lg text-surface-500">Authenticating...</div>
        </div>
    );
}
