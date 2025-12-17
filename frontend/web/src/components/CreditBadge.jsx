import React from 'react';
import { useBilling } from '../state/BillingContext';
import { useNavigate } from 'react-router-dom';

export default function CreditBadge({ showUpgrade = true }) {
    const { balance, isUnlimited, planName, loading } = useBilling();
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="credit-badge loading">
                <span className="icon">🪙</span>
                <span className="amount">...</span>
            </div>
        );
    }

    const isLow = !isUnlimited && balance < 100;

    return (
        <div className={`credit-badge ${isLow ? 'low' : ''} ${isUnlimited ? 'unlimited' : ''}`}>
            {isUnlimited ? (
                <>
                    <span className="icon">⭐</span>
                    <span className="plan">{planName}</span>
                    <span className="unlimited-badge">∞</span>
                </>
            ) : (
                <>
                    <span className="icon">🪙</span>
                    <span className="amount">{balance.toLocaleString()}</span>
                    {isLow && showUpgrade && (
                        <button
                            className="upgrade-btn"
                            onClick={() => navigate('/pricing')}
                        >
                            Upgrade
                        </button>
                    )}
                </>
            )}

            <style>{`
        .credit-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          font-size: 14px;
          font-weight: 500;
        }

        .credit-badge.low {
          border-color: #f59e0b;
          background: rgba(245, 158, 11, 0.1);
        }

        .credit-badge.unlimited {
          border-color: #8b5cf6;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(168, 85, 247, 0.1));
        }

        .credit-badge .icon {
          font-size: 16px;
        }

        .credit-badge .amount {
          color: #fff;
        }

        .credit-badge .plan {
          color: #a78bfa;
          font-weight: 600;
        }

        .credit-badge .unlimited-badge {
          color: #a78bfa;
          font-size: 18px;
          font-weight: bold;
        }

        .credit-badge .upgrade-btn {
          background: linear-gradient(135deg, #8b5cf6, #a855f7);
          color: white;
          border: none;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .credit-badge .upgrade-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
        }

        .credit-badge.loading {
          opacity: 0.7;
        }
      `}</style>
        </div>
    );
}
