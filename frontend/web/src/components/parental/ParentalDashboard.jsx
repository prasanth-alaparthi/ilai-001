/**
 * ILAI Hyper Platform - Parental Dashboard Component
 * 
 * Privacy-first dashboard showing aggregated student progress
 * without revealing private content.
 */

import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    TrendingDown,
    Minus,
    Clock,
    Target,
    Flame,
    Heart,
    BookOpen,
    Users,
    Shield,
    AlertCircle,
    RefreshCw,
    Link2
} from 'lucide-react';
import parentalInsightsService from '../../services/parentalInsightsService';
import './ParentalDashboard.css';

/**
 * Parental Dashboard - Privacy-safe insights for parents
 */
const ParentalDashboard = ({ studentId, studentName }) => {
    const [dashboard, setDashboard] = useState(null);
    const [weeklySummary, setWeeklySummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadDashboard();
    }, [studentId]);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            setError(null);
            const [dashData, weeklyData] = await Promise.all([
                parentalInsightsService.getDashboard(studentId),
                parentalInsightsService.getWeeklySummary(studentId)
            ]);
            setDashboard(dashData);
            setWeeklySummary(weeklyData);
        } catch (err) {
            setError('Failed to load dashboard');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getTrendIcon = (trend) => {
        switch (trend) {
            case 'improving':
                return <TrendingUp className="w-5 h-5 text-green-500" />;
            case 'needs attention':
                return <TrendingDown className="w-5 h-5 text-yellow-500" />;
            default:
                return <Minus className="w-5 h-5 text-gray-500" />;
        }
    };

    const getEngagementColor = (level) => {
        switch (level) {
            case 'High':
                return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'Medium':
                return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            default:
                return 'bg-red-500/20 text-red-400 border-red-500/30';
        }
    };

    if (loading) {
        return (
            <div className="parental-dashboard loading">
                <RefreshCw className="w-8 h-8 animate-spin text-accent-blue" />
                <p>Loading insights...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="parental-dashboard error">
                <AlertCircle className="w-8 h-8 text-red-500" />
                <p>{error}</p>
                <button onClick={loadDashboard} className="retry-btn">
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="parental-dashboard">
            {/* Privacy Notice */}
            <div className="privacy-notice">
                <Shield className="w-5 h-5" />
                <span>
                    This dashboard shows aggregated progress only. Private content like chats,
                    journal entries, and specific notes are never shared.
                </span>
            </div>

            {/* Header */}
            <div className="dashboard-header">
                <h1>{studentName}'s Learning Progress</h1>
                <p>Last active: {dashboard.lastActive}</p>
            </div>

            {/* Quick Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">
                        <Clock className="w-6 h-6 text-accent-blue" />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">~{dashboard.averageStudyHours}hrs</span>
                        <span className="stat-label">Avg. Daily Study</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <Target className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{dashboard.completionRate}</span>
                        <span className="stat-label">Completion Rate</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <Flame className="w-6 h-6 text-orange-500" />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{dashboard.streakDays} days</span>
                        <span className="stat-label">Study Streak</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <Target className="w-6 h-6 text-purple-500" />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{dashboard.goalsAchieved}</span>
                        <span className="stat-label">Goals Achieved</span>
                    </div>
                </div>
            </div>

            {/* Engagement & Trend */}
            <div className="insights-row">
                <div className="insight-card">
                    <h3>Weekly Trend</h3>
                    <div className="trend-display">
                        {getTrendIcon(dashboard.weeklyTrend)}
                        <span className={`trend-label ${dashboard.weeklyTrend.replace(' ', '-')}`}>
                            {dashboard.weeklyTrend.charAt(0).toUpperCase() + dashboard.weeklyTrend.slice(1)}
                        </span>
                    </div>
                </div>

                <div className="insight-card">
                    <h3>Engagement Level</h3>
                    <div className={`engagement-badge ${getEngagementColor(dashboard.engagementLevel)}`}>
                        {dashboard.engagementLevel}
                    </div>
                </div>

                <div className="insight-card">
                    <h3>Mood (if shared)</h3>
                    <div className="mood-display">
                        <Heart className={`w-5 h-5 ${dashboard.moodTrend === 'Positive' ? 'text-pink-500' : 'text-gray-400'}`} />
                        <span>{dashboard.moodTrend}</span>
                    </div>
                </div>
            </div>

            {/* Focus Areas */}
            <div className="focus-section">
                <h3>
                    <BookOpen className="w-5 h-5" />
                    Focus Areas
                </h3>
                <div className="focus-tags">
                    {dashboard.topSubjects.map((subject, i) => (
                        <span key={i} className="focus-tag">{subject}</span>
                    ))}
                </div>
            </div>

            {/* Weekly Summary */}
            {weeklySummary && (
                <div className="weekly-summary">
                    <h3>This Week</h3>
                    <div className="summary-grid">
                        <div className="summary-item">
                            <span className="summary-value">{weeklySummary.studyDays}</span>
                            <span className="summary-label">Study Days</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-value">{weeklySummary.totalHoursRange}</span>
                            <span className="summary-label">Total Time</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-value">{weeklySummary.mostActiveDay}</span>
                            <span className="summary-label">Most Active Day</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-value">{weeklySummary.improvement}</span>
                            <span className="summary-label">Progress</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="dashboard-footer">
                <button onClick={loadDashboard} className="refresh-btn">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>
        </div>
    );
};

export default ParentalDashboard;
