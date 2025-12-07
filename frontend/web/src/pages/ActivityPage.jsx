import React, { useState, useEffect } from 'react';
import { useUser } from '../state/UserContext';
import apiClient from '../services/apiClient';
import { FiHeart, FiMessageCircle, FiUserPlus } from 'react-icons/fi';

export default function ActivityPage() {
    const { user } = useUser();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock activity data for now as we don't have a dedicated activity endpoint yet
        // In a real app, we would fetch from /api/activity
        const mockActivities = [
            { id: 1, type: 'like', user: 'sarah_j', text: 'liked your post.', time: '2m', image: 'https://via.placeholder.com/40' },
            { id: 2, type: 'comment', user: 'mike_codes', text: 'commented: "Great shot!"', time: '1h', image: 'https://via.placeholder.com/40' },
            { id: 3, type: 'follow', user: 'design_daily', text: 'started following you.', time: '3h', image: 'https://via.placeholder.com/40' },
            { id: 4, type: 'like', user: 'travel_bug', text: 'liked your post.', time: '5h', image: 'https://via.placeholder.com/40' },
        ];

        setTimeout(() => {
            setActivities(mockActivities);
            setLoading(false);
        }, 500);
    }, []);

    const getIcon = (type) => {
        switch (type) {
            case 'like': return <FiHeart className="text-white fill-white" />;
            case 'comment': return <FiMessageCircle className="text-white fill-white" />;
            case 'follow': return <FiUserPlus className="text-white fill-white" />;
            default: return null;
        }
    };

    const getIconBg = (type) => {
        switch (type) {
            case 'like': return 'bg-red-500';
            case 'comment': return 'bg-blue-500';
            case 'follow': return 'bg-purple-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="flex justify-center min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white">
            <div className="w-full max-w-[600px] p-4">
                <h1 className="text-2xl font-bold mb-6 px-2">Activity</h1>

                {loading ? (
                    <div className="text-center py-10">Loading...</div>
                ) : (
                    <div className="space-y-4">
                        <div className="font-semibold text-sm text-slate-500 px-2">Today</div>
                        {activities.map(activity => (
                            <div key={activity.id} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                                            {/* Placeholder image */}
                                            <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold text-xs">
                                                {activity.user[0].toUpperCase()}
                                            </div>
                                        </div>
                                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-black flex items-center justify-center text-[10px] ${getIconBg(activity.type)}`}>
                                            {getIcon(activity.type)}
                                        </div>
                                    </div>
                                    <div className="text-sm">
                                        <span className="font-semibold mr-1">{activity.user}</span>
                                        <span className="text-slate-600 dark:text-slate-300">{activity.text}</span>
                                        <span className="text-slate-400 ml-2 text-xs">{activity.time}</span>
                                    </div>
                                </div>
                                {activity.type === 'follow' ? (
                                    <button className="px-4 py-1.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600">
                                        Follow
                                    </button>
                                ) : (
                                    <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
