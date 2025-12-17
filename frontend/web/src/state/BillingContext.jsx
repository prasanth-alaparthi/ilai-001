import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import billingService from '../services/billingService';

const BillingContext = createContext();

// ==========================================
// 🔧 BILLING FEATURE FLAG
// Set to false to enable billing when ready
// ==========================================
const BILLING_DISABLED = true;

export function BillingProvider({ children }) {
    const [credits, setCredits] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchCredits = useCallback(async () => {
        // Skip API calls if billing is disabled
        if (BILLING_DISABLED) {
            setCredits({ balance: 999999, totalEarned: 999999, totalSpent: 0 });
            return;
        }
        try {
            const data = await billingService.getCredits();
            setCredits(data);
        } catch (error) {
            console.error('Failed to fetch credits:', error);
            // Fallback to unlimited on error
            setCredits({ balance: 999999, totalEarned: 999999, totalSpent: 0 });
        }
    }, []);

    const fetchSubscription = useCallback(async () => {
        // Skip API calls if billing is disabled
        if (BILLING_DISABLED) {
            setSubscription({
                plan: 'pro_plus',
                planName: 'Pro+ (Testing)',
                status: 'active',
                isActive: true,
                isPaid: true,
                isUnlimited: true
            });
            return;
        }
        try {
            const data = await billingService.getSubscription();
            setSubscription(data);
        } catch (error) {
            console.error('Failed to fetch subscription:', error);
            // Fallback to unlimited on error
            setSubscription({
                plan: 'pro_plus',
                planName: 'Pro+ (Fallback)',
                isUnlimited: true,
                isPaid: true
            });
        }
    }, []);

    const refresh = useCallback(async () => {
        setLoading(true);
        await Promise.all([fetchCredits(), fetchSubscription()]);
        setLoading(false);
    }, [fetchCredits, fetchSubscription]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const hasEnoughCredits = useCallback((cost) => {
        // Always return true if billing is disabled
        if (BILLING_DISABLED) return true;
        if (subscription?.isUnlimited) return true;
        return credits?.balance >= cost;
    }, [credits, subscription]);

    const value = {
        credits,
        subscription,
        loading,
        refresh,
        hasEnoughCredits,
        balance: BILLING_DISABLED ? 999999 : (credits?.balance || 0),
        isUnlimited: BILLING_DISABLED ? true : (subscription?.isUnlimited || false),
        isPaid: BILLING_DISABLED ? true : (subscription?.isPaid || false),
        plan: BILLING_DISABLED ? 'pro_plus' : (subscription?.plan || 'free'),
        planName: BILLING_DISABLED ? 'Pro+ (Testing)' : (subscription?.planName || 'Free'),
        billingDisabled: BILLING_DISABLED // Expose flag for debugging
    };

    return (
        <BillingContext.Provider value={value}>
            {children}
        </BillingContext.Provider>
    );
}

export function useBilling() {
    const context = useContext(BillingContext);
    if (!context) {
        // Return safe defaults if used outside provider
        return {
            credits: { balance: 999999 },
            subscription: { isUnlimited: true, isPaid: true, plan: 'pro_plus' },
            loading: false,
            refresh: () => { },
            hasEnoughCredits: () => true,
            balance: 999999,
            isUnlimited: true,
            isPaid: true,
            plan: 'pro_plus',
            planName: 'Pro+ (Testing)',
            billingDisabled: true
        };
    }
    return context;
}

export default BillingContext;

