import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import apiClient from '../services/apiClient';
import { useUser } from './UserContext'; // Import useUser

const ParentalContext = createContext();

export function ParentalProvider({ children }) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, loading: userLoading } = useUser(); // Get user and userLoading from UserContext

  const fetchStatus = useCallback(async () => {
    // Only attempt to fetch status if user is logged in
    if (!user) {
      setEnabled(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.get('/parental/pin/status');
      setEnabled(res.data?.enabled || false);
    } catch {
      console.error("Failed to fetch parental pin status");
      setEnabled(false);
    } finally {
      console.log("ParentalLockContext: setLoading(false) called");
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Fetch status only after UserContext has finished loading and user state is known
    if (!userLoading) {
      fetchStatus();
    }
  }, [user, userLoading]); // Re-run when user or userLoading changes

  return <ParentalContext.Provider value={{ enabled, refresh: fetchStatus, loading }}>{children}</ParentalContext.Provider>;
}

export function useParental() {
  return useContext(ParentalContext);
}