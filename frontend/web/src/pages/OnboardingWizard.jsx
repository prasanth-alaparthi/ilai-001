import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiBook, FiBriefcase, FiShield, FiArrowRight, FiCheck } from 'react-icons/fi';
import { authService } from '../services/authService';

const ROLES = [
    {
        id: 'STUDENT',
        title: 'Student',
        icon: FiUser,
        description: 'I want to learn and grow.',
        color: 'bg-blue-500',
        textColor: 'text-blue-500'
    },
    {
        id: 'TEACHER',
        title: 'Teacher',
        icon: FiBook,
        description: 'I want to inspire and educate.',
        color: 'bg-emerald-500',
        textColor: 'text-emerald-500'
    },
    {
        id: 'PARENT',
        title: 'Parent',
        icon: FiBriefcase,
        description: 'I want to track progress.',
        color: 'bg-purple-500',
        textColor: 'text-purple-500'
    },
    // Admin is hidden from the main list
];

export default function OnboardingWizard({ onLoginClick }) {
    const [step, setStep] = useState(1);
    const [role, setRole] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        dateOfBirth: '',
        gender: '',
        institutionCode: '',
        adminKey: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Hidden admin trigger
    const [showAdmin, setShowAdmin] = useState(false);

    const handleRoleSelect = (selectedRole) => {
        setRole(selectedRole);
        setStep(2);
        setError('');
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const payload = {
                ...formData,
                role: role
            };

            // Clean up payload based on role
            if (role !== 'TEACHER') delete payload.institutionCode;
            if (role !== 'INSTITUTION_ADMIN' && role !== 'ADMIN') delete payload.adminKey;

            await authService.register(payload);
            setSuccess(true);
        } catch (err) {
            console.error("Registration error:", err);
            setError(err.response?.data?.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Step 1: Identity Selection
    const renderStep1 = () => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="text-center">
                <h2 className="text-3xl font-bold text-surface-900 dark:text-white">Who are you?</h2>
                <p className="text-surface-500 dark:text-surface-400 mt-2">Choose your path to get started.</p>
            </div>

            <div className="grid gap-4">
                {ROLES.map((r) => (
                    <button
                        key={r.id}
                        onClick={() => handleRoleSelect(r.id)}
                        className="flex items-center p-4 rounded-xl border-2 border-surface-200 dark:border-surface-700 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-surface-800 transition-all group text-left"
                    >
                        <div className={`p-3 rounded-full ${r.color} bg-opacity-10 mr-4`}>
                            <r.icon className={`w-6 h-6 ${r.textColor}`} />
                        </div>
                        <div>
                            <h3 className="font-bold text-surface-900 dark:text-white">{r.title}</h3>
                            <p className="text-sm text-surface-500 dark:text-surface-400">{r.description}</p>
                        </div>
                        <FiArrowRight className="ml-auto text-surface-400 group-hover:text-indigo-500 transition-colors" />
                    </button>
                ))}

                {/* Hidden Admin Button (Visible only if showAdmin is true) */}
                {showAdmin && (
                    <button
                        onClick={() => handleRoleSelect('INSTITUTION_ADMIN')}
                        className="flex items-center p-4 rounded-xl border-2 border-red-200 dark:border-red-900/50 hover:border-red-500 dark:hover:border-red-500 bg-white dark:bg-surface-800 transition-all group text-left"
                    >
                        <div className="p-3 rounded-full bg-red-500 bg-opacity-10 mr-4">
                            <FiShield className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-surface-900 dark:text-white">Administrator</h3>
                            <p className="text-sm text-surface-500 dark:text-surface-400">System access.</p>
                        </div>
                        <FiArrowRight className="ml-auto text-surface-400 group-hover:text-red-500 transition-colors" />
                    </button>
                )}
            </div>

            <div className="text-center pt-4">
                <button
                    onClick={() => setShowAdmin(!showAdmin)}
                    className="text-xs text-surface-300 hover:text-surface-500 transition-colors"
                >
                    Staff Access
                </button>
            </div>

            <div className="text-center mt-6">
                <p className="text-surface-500 dark:text-surface-400">
                    Already have an account?{' '}
                    <button onClick={onLoginClick} className="text-indigo-600 font-medium hover:underline">
                        Login
                    </button>
                </p>
            </div>
        </motion.div>
    );

    // Step 2: Details Form
    const renderStep2 = () => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="text-center">
                <button onClick={() => setStep(1)} className="text-sm text-surface-500 hover:text-surface-700 mb-4">
                    ← Back
                </button>
                <h2 className="text-2xl font-bold text-surface-900 dark:text-white">
                    {role === 'STUDENT' && "Let's get you set up"}
                    {role === 'TEACHER' && "Teacher Verification"}
                    {role === 'INSTITUTION_ADMIN' && "Admin Access"}
                    {role === 'PARENT' && "Parent Registration"}
                </h2>
                <p className="text-surface-500 dark:text-surface-400 mt-1">
                    {role === 'TEACHER' ? "We need a few details to verify your status." : "Fill in your details to create your account."}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-200 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-3">
                    <input
                        name="username"
                        type="text"
                        placeholder="Username"
                        required
                        value={formData.username}
                        onChange={handleInputChange}
                        className="w-full p-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <input
                        name="email"
                        type="email"
                        placeholder="Email Address"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full p-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <input
                        name="password"
                        type="password"
                        placeholder="Password"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full p-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <input
                            name="dateOfBirth"
                            type="date"
                            required
                            value={formData.dateOfBirth}
                            onChange={handleInputChange}
                            className="w-full p-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <select
                            name="gender"
                            required
                            value={formData.gender}
                            onChange={handleInputChange}
                            className="w-full p-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="">Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    {/* Role Specific Fields */}
                    {role === 'TEACHER' && (
                        <div className="pt-2">
                            <label className="text-xs font-medium text-surface-500 uppercase">Verification (Optional)</label>
                            <input
                                name="institutionCode"
                                type="text"
                                placeholder="Institution Code (if you have one)"
                                value={formData.institutionCode}
                                onChange={handleInputChange}
                                className="w-full p-3 mt-1 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <p className="text-xs text-surface-400 mt-1">
                                If you don't have a code, your account will be pending approval.
                            </p>
                        </div>
                    )}

                    {(role === 'INSTITUTION_ADMIN' || role === 'ADMIN') && (
                        <div className="pt-2">
                            <label className="text-xs font-medium text-red-500 uppercase">Security Check</label>
                            <input
                                name="adminKey"
                                type="password"
                                placeholder="Admin Secret Key"
                                required
                                value={formData.adminKey}
                                onChange={handleInputChange}
                                className="w-full p-3 mt-1 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 focus:ring-2 focus:ring-red-500 outline-none"
                            />
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30 disabled:opacity-70"
                >
                    {loading ? 'Creating Account...' : 'Create Account'}
                </button>
            </form>
        </motion.div>
    );

    // Step 3: Success
    const renderSuccess = () => (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 py-10"
        >
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto text-green-600 dark:text-green-400">
                <FiCheck className="w-10 h-10" />
            </div>
            <div>
                <h2 className="text-3xl font-bold text-surface-900 dark:text-white">Welcome to Ilai!</h2>
                <p className="text-surface-500 dark:text-surface-400 mt-2 max-w-xs mx-auto">
                    {role === 'TEACHER' && !formData.institutionCode
                        ? "Your account has been created and is pending approval. You will be notified once verified."
                        : "Your account has been successfully created. Please check your email to verify your address."}
                </p>
            </div>
            <button
                onClick={onLoginClick}
                className="px-8 py-3 rounded-xl bg-surface-900 dark:bg-white text-white dark:text-surface-900 font-bold hover:opacity-90 transition-opacity"
            >
                Go to Login
            </button>
        </motion.div>
    );

    return (
        <div className="w-full max-w-md mx-auto">
            <AnimatePresence mode="wait">
                {success ? renderSuccess() : (step === 1 ? renderStep1() : renderStep2())}
            </AnimatePresence>
        </div>
    );
}
