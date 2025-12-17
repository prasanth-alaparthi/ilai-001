import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import billingService from '../services/billingService';

export default function Pricing() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            const data = await billingService.getPlans();
            setPlans(data);
        } catch (error) {
            console.error('Failed to load plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPlan = (planId) => {
        navigate(`/checkout/${planId}`);
    };

    if (loading) {
        return (
            <div className="pricing-page loading">
                <div className="spinner"></div>
                <p>Loading plans...</p>
            </div>
        );
    }

    return (
        <div className="pricing-page">
            <div className="pricing-header">
                <h1>Choose Your Plan</h1>
                <p>Unlock the full power of AI-assisted learning</p>
            </div>

            <div className="pricing-cards">
                {/* Free Plan */}
                <div className="plan-card free">
                    <div className="plan-badge">Current</div>
                    <h2>Free</h2>
                    <div className="price">
                        <span className="amount">₹0</span>
                        <span className="period">/forever</span>
                    </div>
                    <div className="credits">1,000 credits (one-time)</div>
                    <ul className="features">
                        <li>✓ Basic AI features</li>
                        <li>✓ Notes & Feed</li>
                        <li>✓ Calendar</li>
                        <li>✗ Voice interface</li>
                        <li>✗ Research Agent</li>
                    </ul>
                    <button className="plan-btn current" disabled>
                        Current Plan
                    </button>
                </div>

                {/* Paid Plans */}
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={`plan-card ${plan.id} ${plan.featured ? 'featured' : ''}`}
                    >
                        {plan.featured && <div className="plan-badge featured">Most Popular</div>}
                        <h2>{plan.name}</h2>
                        <div className="price">
                            <span className="amount">₹{plan.price}</span>
                            <span className="period">/month</span>
                        </div>
                        <div className="credits">{plan.credits}</div>
                        <ul className="features">
                            {plan.features.map((feature, idx) => (
                                <li key={idx}>✓ {feature}</li>
                            ))}
                        </ul>
                        <button
                            className="plan-btn"
                            onClick={() => handleSelectPlan(plan.id)}
                        >
                            Upgrade to {plan.name}
                        </button>
                    </div>
                ))}
            </div>

            <div className="pricing-faq">
                <h3>Frequently Asked Questions</h3>
                <div className="faq-item">
                    <h4>How do credits work?</h4>
                    <p>Each AI feature uses a certain number of credits. For example, one AI chat costs 1 credit, generating flashcards costs 5 credits.</p>
                </div>
                <div className="faq-item">
                    <h4>What happens when I run out of credits?</h4>
                    <p>AI features will be disabled until you upgrade or wait for your monthly credit renewal (Pro plan).</p>
                </div>
                <div className="faq-item">
                    <h4>How do I pay?</h4>
                    <p>We accept UPI payments. After selecting a plan, you'll see our UPI ID to send payment to.</p>
                </div>
            </div>

            <style>{`
        .pricing-page {
          min-height: 100vh;
          padding: 40px 20px;
          background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
        }

        .pricing-page.loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .pricing-header {
          text-align: center;
          margin-bottom: 50px;
        }

        .pricing-header h1 {
          font-size: 2.5rem;
          color: #fff;
          margin-bottom: 10px;
        }

        .pricing-header p {
          color: #a0aec0;
          font-size: 1.1rem;
        }

        .pricing-cards {
          display: flex;
          justify-content: center;
          gap: 24px;
          flex-wrap: wrap;
          max-width: 1200px;
          margin: 0 auto;
        }

        .plan-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 32px;
          width: 280px;
          position: relative;
          transition: transform 0.3s, box-shadow 0.3s;
        }

        .plan-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .plan-card.featured {
          border-color: #8b5cf6;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(168, 85, 247, 0.05));
          transform: scale(1.05);
        }

        .plan-card.featured:hover {
          transform: scale(1.05) translateY(-5px);
        }

        .plan-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: #374151;
          color: #fff;
          padding: 4px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .plan-badge.featured {
          background: linear-gradient(135deg, #8b5cf6, #a855f7);
        }

        .plan-card h2 {
          color: #fff;
          font-size: 1.5rem;
          margin-bottom: 16px;
          text-align: center;
        }

        .price {
          text-align: center;
          margin-bottom: 8px;
        }

        .price .amount {
          font-size: 2.5rem;
          font-weight: 700;
          color: #fff;
        }

        .price .period {
          color: #a0aec0;
          font-size: 1rem;
        }

        .credits {
          text-align: center;
          color: #8b5cf6;
          font-weight: 600;
          margin-bottom: 24px;
        }

        .features {
          list-style: none;
          padding: 0;
          margin: 0 0 24px 0;
        }

        .features li {
          color: #e2e8f0;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .features li:last-child {
          border-bottom: none;
        }

        .plan-btn {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          background: linear-gradient(135deg, #8b5cf6, #a855f7);
          color: white;
        }

        .plan-btn:hover {
          transform: scale(1.02);
          box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
        }

        .plan-btn.current {
          background: #374151;
          cursor: default;
        }

        .plan-btn.current:hover {
          transform: none;
          box-shadow: none;
        }

        .pricing-faq {
          max-width: 800px;
          margin: 60px auto 0;
          padding: 0 20px;
        }

        .pricing-faq h3 {
          color: #fff;
          text-align: center;
          margin-bottom: 30px;
        }

        .faq-item {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
        }

        .faq-item h4 {
          color: #e2e8f0;
          margin-bottom: 8px;
        }

        .faq-item p {
          color: #a0aec0;
          margin: 0;
        }
      `}</style>
        </div>
    );
}
