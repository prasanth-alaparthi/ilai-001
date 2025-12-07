import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { FiSearch, FiCheck, FiX, FiShield, FiUser, FiBook } from 'react-icons/fi';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await adminService.getAllUsers();
            setUsers(data);
        } catch (err) {
            console.error("Failed to load users", err);
            setError("Failed to load users.");
        } finally {
            setLoading(false);
        }
    };

    const handleRoleUpdate = async (userId, newRole) => {
        try {
            await adminService.updateUserRole(userId, newRole);
            // Refresh list or update local state
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole, status: 'ACTIVE' } : u));
        } catch (err) {
            console.error("Failed to update role", err);
            alert("Failed to update role: " + (err.response?.data?.message || err.message));
        }
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const pendingTeachers = filteredUsers.filter(u => u.role === 'TEACHER' && u.status === 'PENDING_VERIFICATION');
    const activeUsers = filteredUsers.filter(u => !(u.role === 'TEACHER' && u.status === 'PENDING_VERIFICATION'));

    if (loading) return <div className="p-8 text-center">Loading users...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-surface-900 dark:text-white">User Management</h2>
                <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
            </div>

            {error && <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}

            {/* Pending Approvals Section */}
            {pendingTeachers.length > 0 && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-orange-800 dark:text-orange-200 mb-4 flex items-center">
                        <FiShield className="mr-2" /> Pending Teacher Approvals
                    </h3>
                    <div className="grid gap-4">
                        {pendingTeachers.map(user => (
                            <div key={user.id} className="flex items-center justify-between bg-white dark:bg-surface-800 p-4 rounded-lg shadow-sm">
                                <div>
                                    <p className="font-bold text-surface-900 dark:text-white">{user.username}</p>
                                    <p className="text-sm text-surface-500">{user.email}</p>
                                    <p className="text-xs text-orange-600 mt-1">Institution Code: {user.institutionId || 'None'}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleRoleUpdate(user.id, 'TEACHER')}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center text-sm"
                                    >
                                        <FiCheck className="mr-1" /> Approve
                                    </button>
                                    <button
                                        onClick={() => handleRoleUpdate(user.id, 'STUDENT')}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center text-sm"
                                    >
                                        <FiX className="mr-1" /> Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* All Users Table */}
            <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-surface-50 dark:bg-surface-700/50 text-surface-500 dark:text-surface-400 text-xs uppercase font-medium">
                        <tr>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                        {activeUsers.map(user => (
                            <tr key={user.id} className="hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mr-3">
                                            <FiUser />
                                        </div>
                                        <div>
                                            <p className="font-medium text-surface-900 dark:text-white">{user.username}</p>
                                            <p className="text-xs text-surface-500">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${user.role === 'ADMIN' || user.role === 'INSTITUTION_ADMIN' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                            user.role === 'TEACHER' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-surface-500">
                                    {user.status}
                                </td>
                                <td className="px-6 py-4">
                                    <select
                                        value={user.role}
                                        onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                                        className="text-sm border border-surface-200 dark:border-surface-600 rounded-lg p-1 bg-transparent focus:ring-2 focus:ring-indigo-500"
                                        disabled={user.role === 'INSTITUTION_ADMIN' && user.id === 1} // Prevent demoting the main admin (simple check)
                                    >
                                        <option value="STUDENT">Student</option>
                                        <option value="TEACHER">Teacher</option>
                                        <option value="INSTITUTION_ADMIN">Admin</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
