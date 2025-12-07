import React, { useState } from 'react';
import apiClient from '../../services/apiClient';

export default function PinVerifyModal({ onClose, onVerified }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleVerify() {
    setError(null);
    if (!pin) { return; }
    setLoading(true);
    try {
      const response = await apiClient.post('/parental/pin/verify', { pin });
      if (response.data.success) {
        onVerified?.();
        onClose();
      } else {
        setError('Invalid PIN');
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Invalid PIN');
    } finally { setLoading(false); }
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter') {
      handleVerify();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold">Enter Parent PIN</h3>
        <p className="text-sm text-slate-500 mt-1">Please enter the parent PIN to proceed.</p>

        <div className="mt-4 space-y-2">
          <input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter PIN"
            className="w-full p-2 border rounded"
            autoFocus
          />
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 rounded border">Cancel</button>
          <button onClick={handleVerify} className="px-3 py-1 rounded bg-indigo-600 text-white" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </div>
    </div>
  );
}
