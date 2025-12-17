import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBilling } from '../state/BillingContext';

export default function CreditWarningModal({ feature, cost, onClose }) {
    const { balance, isUnlimited } = useBilling();
    const navigate = useNavigate();

    // Don't show if user has unlimited or enough credits
    if (isUnlimited || balance >= cost) {
        return null;
    }

    return (
        <div className="credit-warning-overlay" onClick={onClose}>
            <div className="credit-warning-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>×</button>

                <div className="warning-icon">😅</div>
                <h2>Out of Credits!</h2>

                <p className="warning-message">
                    You need <strong>{cost} credits</strong> for {feature},
                    but you only have <strong>{balance}</strong>.
                </p>

                <div className="plan-options">
                    <div className="plan-option">
                        <h3>Pro</h3>
                        <div className="price">₹199/mo</div>
                        <div className="credits">5,000 credits/month</div>
                        <button onClick={() => navigate('/checkout/pro')}>
                            Upgrade
                        </button>
                    </div>
                    <div className="plan-option featured">
                        <span className="badge">Best Value</span>
                        <h3>Pro+</h3>
                        <div className="price">₹499/mo</div>
                        <div className="credits">Unlimited AI</div>
                        <button onClick={() => navigate('/checkout/pro_plus')}>
                            Go Unlimited
                        </button>
                    </div>
                </div>

                <button className="view-all-btn" onClick={() => navigate('/pricing')}>
                    View All Plans
                </button>

                <style>{`
          .credit-warning-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .credit-warning-modal {
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 40px;
            max-width: 500px;
            width: 90%;
            text-align: center;
            position: relative;
          }

          .close-btn {
            position: absolute;
            top: 16px;
            right: 16px;
            background: none;
            border: none;
            color: #a0aec0;
            font-size: 24px;
            cursor: pointer;
          }

          .warning-icon {
            font-size: 64px;
            margin-bottom: 16px;
          }

          .credit-warning-modal h2 {
            color: #fff;
            margin-bottom: 12px;
          }

          .warning-message {
            color: #e2e8f0;
            margin-bottom: 24px;
          }

          .warning-message strong {
            color: #f59e0b;
          }

          .plan-options {
            display: flex;
            gap: 16px;
            margin-bottom: 16px;
          }

          .plan-option {
            flex: 1;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 20px;
            position: relative;
          }

          .plan-option.featured {
            border-color: #8b5cf6;
            background: rgba(139, 92, 246, 0.1);
          }

          .plan-option .badge {
            position: absolute;
            top: -10px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #8b5cf6, #a855f7);
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
          }

          .plan-option h3 {
            color: #fff;
            margin: 0 0 8px 0;
          }

          .plan-option .price {
            color: #8b5cf6;
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 4px;
          }

          .plan-option .credits {
            color: #a0aec0;
            font-size: 13px;
            margin-bottom: 12px;
          }

          .plan-option button {
            width: 100%;
            padding: 10px;
            background: linear-gradient(135deg, #8b5cf6, #a855f7);
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
          }

          .plan-option button:hover {
            transform: scale(1.02);
          }

          .view-all-btn {
            background: none;
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: #a0aec0;
            padding: 10px 24px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .view-all-btn:hover {
            border-color: #8b5cf6;
            color: #8b5cf6;
          }
        `}</style>
            </div>
        </div>
    );
}
