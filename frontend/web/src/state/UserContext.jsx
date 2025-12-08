// File: src/state/UserContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import apiClient from '../services/apiClient';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.removeItem("accessToken");
      setUser(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    // Skip fetching if user is already set (e.g., from OAuth2RedirectHandler)
    if (user) {
      setLoading(false);
      return;
    }

    (async () => {
      const token = localStorage.getItem("accessToken");
      // Only fetch user if we have a token
      if (!token) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const res = await apiClient.get("/auth/me");
        if (mounted) setUser(res.data);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) {
          console.log("UserContext: setLoading(false) called");
          setLoading(false);
        }
      }
    })();
    return () => (mounted = false);
  }, [user]);

  useEffect(() => {
    const handleAuthError = () => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setUser(null);
      setLoading(false); // Ensure loading terminates on auth errors
    };
    window.addEventListener("auth-error", handleAuthError);
    return () => window.removeEventListener("auth-error", handleAuthError);
  }, []);

  return <UserContext.Provider value={{ user, setUser, loading, logout }}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}