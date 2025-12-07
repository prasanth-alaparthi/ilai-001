// src/pages/PendingVerification.jsx
import React from 'react';
import { useUser } from '../state/UserContext';

export default function PendingVerification() {
  const { user, logout } = useUser();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-md rounded-lg p-8">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">
          Account Pending Verification
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
          Welcome, {user?.username}! Your account has been created, but it is currently pending verification by your institution.
        </p>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
          You will have limited access until your account is approved.
        </p>
        <div className="flex justify-center">
            <button
                onClick={() => alert('A notification has been sent to your institution.')}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline mr-4"
            >
                Request Verification
            </button>
            <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
            >
                Logout
            </button>
        </div>
      </div>
    </div>
  );
}
