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
    (async () => {
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
  }, []);

  useEffect(() => {
    const handleAuthError = () => {
      localStorage.removeItem("accessToken");
      setUser(null);
    };
    window.addEventListener("auth-error", handleAuthError);
    return () => window.removeEventListener("auth-error", handleAuthError);
  }, []);

  return <UserContext.Provider value={{ user, setUser, loading, logout }}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}