import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import billingService from '../services/billingService';
import { useBilling } from '../state/BillingContext';

export default function Checkout() {
    const { planId } = useParams();
    const navigate = useNavigate();
    const { refresh } = useBilling();

    const [paymentInfo, setPaymentInfo] = useState(null);
    const [transactionId, setTransactionId] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadPaymentInfo();
    }, [planId]);

    const loadPaymentInfo = async () => {
        try {
            const data = await billingService.getPaymentInfo(planId);
            setPaymentInfo(data);
        } catch (error) {
            console.error('Failed to load payment info:', error);
            navigate('/pricing');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!transactionId.trim()) {
            setError('Please enter the UPI transaction ID');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            await billingService.submitPayment(planId, transactionId.trim());
            setSubmitted(true);
            refresh();
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to submit payment');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="checkout-page loading">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="checkout-page">
                <div className="success-card">
                    <div className="success-icon">✅</div>
                    <h2>Payment Submitted!</h2>
                    <p>Thank you for your payment. We'll verify and activate your {paymentInfo?.planName} subscription within 24 hours.</p>
                    <p className="note">Usually verification happens within a few hours.</p>
                    <button onClick={() => navigate('/')} className="back-btn">
                        Back to Home
                    </button>
                </div>
                <style>{checkoutStyles}</style>
            </div>
        );
    }

    return (
        <div className="checkout-page">
            <div className="checkout-card">
                <button className="back-link" onClick={() => navigate('/pricing')}>
                    ← Back to Plans
                </button>

                <h1>Complete Your Upgrade</h1>

                <div className="plan-summary">
                    <h2>{paymentInfo?.planName}</h2>
                    <div className="price">₹{paymentInfo?.amount}/month</div>
                </div>

                <div className="payment-section">
                    <h3>Step 1: Pay via UPI</h3>

                    {paymentInfo?.upiId ? (
                        <div className="upi-details">
                            <div className="qr-placeholder">
                                <span>📱</span>
                                <p>Scan QR or use UPI ID below</p>
                            </div>
                            <div className="upi-id">
                                <label>UPI ID:</label>
                                <div className="upi-value">
                                    <span>{paymentInfo.upiId}</span>
                                    <button
                                        className="copy-btn"
                                        onClick={() => navigator.clipboard.writeText(paymentInfo.upiId)}
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>
                            <div className="upi-amount">
                                <label>Amount:</label>
                                <span>₹{paymentInfo.amount}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="upi-pending">
                            <p>⚠️ UPI payment details not configured yet.</p>
                            <p>Please contact support to complete your upgrade.</p>
                        </div>
                    )}
                </div>

                {paymentInfo?.upiId && (
                    <form onSubmit={handleSubmit} className="verification-section">
                        <h3>Step 2: Enter Transaction ID</h3>
                        <p className="help-text">
                            After payment, enter the UPI transaction ID from your payment app.
                        </p>

                        <div className="input-group">
                            <input
                                type="text"
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                                placeholder="e.g., 435678901234"
                                disabled={submitting}
                            />
                        </div>

                        {error && <div className="error-msg">{error}</div>}

                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={submitting}
                        >
                            {submitting ? 'Submitting...' : 'Verify & Activate'}
                        </button>

                        <p className="note">
                            ⏱️ Verification usually takes a few hours (max 24 hours)
                        </p>
                    </form>
                )}
            </div>

            <style>{checkoutStyles}</style>
        </div>
    );
}

const checkoutStyles = `
  .checkout-page {
    min-height: 100vh;
    padding: 40px 20px;
    background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }

  .checkout-page.loading {
    align-items: center;
  }

  .checkout-card, .success-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    padding: 40px;
    max-width: 500px;
    width: 100%;
  }

  .back-link {
    background: none;
    border: none;
    color: #8b5cf6;
    cursor: pointer;
    font-size: 14px;
    padding: 0;
    margin-bottom: 20px;
  }

  .checkout-card h1 {
    color: #fff;
    font-size: 1.8rem;
    margin-bottom: 24px;
  }

  .plan-summary {
    background: rgba(139, 92, 246, 0.1);
    border: 1px solid rgba(139, 92, 246, 0.3);
    border-radius: 16px;
    padding: 20px;
    text-align: center;
    margin-bottom: 32px;
  }

  .plan-summary h2 {
    color: #a78bfa;
    margin: 0 0 8px 0;
  }

  .plan-summary .price {
    color: #fff;
    font-size: 2rem;
    font-weight: 700;
  }

  .payment-section, .verification-section {
    margin-bottom: 32px;
  }

  .payment-section h3, .verification-section h3 {
    color: #e2e8f0;
    font-size: 1.1rem;
    margin-bottom: 16px;
  }

  .upi-details {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 20px;
  }

  .qr-placeholder {
    text-align: center;
    padding: 30px;
    border: 2px dashed rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    margin-bottom: 16px;
  }

  .qr-placeholder span {
    font-size: 48px;
    display: block;
    margin-bottom: 8px;
  }

  .qr-placeholder p {
    color: #a0aec0;
    margin: 0;
  }

  .upi-id, .upi-amount {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .upi-id label, .upi-amount label {
    color: #a0aec0;
  }

  .upi-value {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .upi-value span, .upi-amount span {
    color: #fff;
    font-weight: 600;
  }

  .copy-btn {
    background: #374151;
    color: #fff;
    border: none;
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
  }

  .upi-pending {
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
  }

  .upi-pending p {
    color: #fbbf24;
    margin: 8px 0;
  }

  .help-text {
    color: #a0aec0;
    font-size: 14px;
    margin-bottom: 16px;
  }

  .input-group input {
    width: 100%;
    padding: 14px 16px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    color: #fff;
    font-size: 1rem;
  }

  .input-group input:focus {
    outline: none;
    border-color: #8b5cf6;
  }

  .error-msg {
    color: #ef4444;
    margin: 12px 0;
    font-size: 14px;
  }

  .submit-btn {
    width: 100%;
    padding: 16px;
    background: linear-gradient(135deg, #8b5cf6, #a855f7);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    margin-top: 16px;
    transition: all 0.3s;
  }

  .submit-btn:hover:not(:disabled) {
    transform: scale(1.02);
    box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
  }

  .submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .note {
    color: #a0aec0;
    font-size: 13px;
    text-align: center;
    margin-top: 16px;
  }

  .success-card {
    text-align: center;
  }

  .success-icon {
    font-size: 64px;
    margin-bottom: 20px;
  }

  .success-card h2 {
    color: #10b981;
    margin-bottom: 16px;
  }

  .success-card p {
    color: #e2e8f0;
    margin-bottom: 8px;
  }

  .back-btn {
    margin-top: 24px;
    padding: 14px 32px;
    background: #374151;
    color: #fff;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    cursor: pointer;
  }
`;
