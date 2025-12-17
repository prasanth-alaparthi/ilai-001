import { useState, useCallback, useEffect } from 'react';
import apiClient from '../services/apiClient';

/**
 * Hook for payment processing with Razorpay, UPI (GPay/PhonePe)
 */
export function usePayments() {
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState([]);
    const [error, setError] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState(null);

    // Load Razorpay script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        return () => document.body.removeChild(script);
    }, []);

    // Fetch available plans
    const fetchPlans = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/api/payments/plans');
            setPlans(response.data);
            return response.data;
        } catch (err) {
            console.error('Failed to fetch plans:', err);
            setError('Failed to load pricing plans');
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // Initiate payment with Razorpay checkout
    const initiatePayment = useCallback(async (planId, paymentMethod = 'card') => {
        try {
            setLoading(true);
            setError(null);
            setPaymentStatus(null);

            const user = JSON.parse(localStorage.getItem('user') || '{}');

            // Create order
            const { data } = await apiClient.post('/api/payments/create-order', {
                planId,
                userId: user?.id,
                paymentMethod
            });

            if (!data.success) {
                throw new Error(data.error || 'Failed to create order');
            }

            if (data.isFree) {
                setPaymentStatus({ success: true, message: 'Free plan activated!' });
                return { success: true, planId };
            }

            // Open Razorpay checkout
            return new Promise((resolve, reject) => {
                const options = {
                    key: data.keyId,
                    amount: data.amount,
                    currency: data.currency,
                    name: 'ILAI',
                    description: data.planName + ' Subscription',
                    order_id: data.orderId,
                    prefill: {
                        name: user?.name || '',
                        email: user?.email || '',
                    },
                    theme: {
                        color: '#6366f1'
                    },
                    modal: {
                        ondismiss: () => {
                            setLoading(false);
                            setPaymentStatus({ success: false, message: 'Payment cancelled' });
                            reject(new Error('Payment cancelled'));
                        }
                    },
                    handler: async (response) => {
                        // Verify payment
                        const verifyResult = await verifyPayment(
                            response.razorpay_order_id,
                            response.razorpay_payment_id,
                            response.razorpay_signature
                        );
                        resolve(verifyResult);
                    }
                };

                // Configure for UPI if selected
                if (paymentMethod === 'upi' || paymentMethod === 'gpay' || paymentMethod === 'phonepe') {
                    options.method = {
                        upi: true,
                        card: false,
                        netbanking: false,
                        wallet: false
                    };
                }

                const razorpay = new window.Razorpay(options);
                razorpay.open();
            });
        } catch (err) {
            console.error('Payment initiation failed:', err);
            setError(err.message || 'Payment failed');
            setPaymentStatus({ success: false, message: err.message });
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Create UPI deep link for mobile
    const createUpiLink = useCallback(async (planId, preferredApp = 'gpay') => {
        try {
            setLoading(true);
            const user = JSON.parse(localStorage.getItem('user') || '{}');

            const { data } = await apiClient.post('/api/payments/upi-link', {
                planId,
                userId: user?.id,
                preferredApp
            });

            if (!data.success) {
                throw new Error(data.error);
            }

            return data;
        } catch (err) {
            console.error('Failed to create UPI link:', err);
            setError('Failed to create UPI payment link');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Verify payment
    const verifyPayment = useCallback(async (orderId, paymentId, signature) => {
        try {
            setLoading(true);
            const user = JSON.parse(localStorage.getItem('user') || '{}');

            const { data } = await apiClient.post('/api/payments/verify', {
                orderId,
                paymentId,
                signature,
                userId: user?.id?.toString()
            });

            if (data.success) {
                setPaymentStatus({
                    success: true,
                    message: 'Payment successful!',
                    paymentId: data.paymentId,
                    method: data.method
                });
            } else {
                setPaymentStatus({ success: false, message: data.error });
            }

            return data;
        } catch (err) {
            console.error('Payment verification failed:', err);
            setPaymentStatus({ success: false, message: 'Verification failed' });
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, []);

    // Check if mobile (for UPI deep links)
    const isMobile = () => {
        return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    };

    // Open UPI app directly
    const openUpiApp = useCallback((upiLink, app = 'gpay') => {
        let url;
        switch (app) {
            case 'gpay':
                url = `gpay://upi/${upiLink.replace('upi://', '')}`;
                break;
            case 'phonepe':
                url = `phonepe://pay?${upiLink.replace('upi://pay?', '')}`;
                break;
            case 'paytm':
                url = `paytmmp://upi/${upiLink.replace('upi://', '')}`;
                break;
            default:
                url = upiLink;
        }
        window.location.href = url;
    }, []);

    return {
        plans,
        loading,
        error,
        paymentStatus,
        fetchPlans,
        initiatePayment,
        createUpiLink,
        verifyPayment,
        openUpiApp,
        isMobile: isMobile()
    };
}

export default usePayments;
