import React, { useState } from 'react';
import apiClient from '../../services/apiClient';

export default function PinSetupModal({ onClose, onDone }) {
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSetup() {
    setError(null);
    if (pin.length < 4) { setError('PIN must be at least 4 digits'); return; }
    if (pin !== confirm) { setError('PINs do not match'); return; }
    setLoading(true);
    try {
      await apiClient.post('/parental/pin/setup', { pin });
      onDone?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold">Set a Parent PIN</h3>
        <p className="text-sm text-slate-500 mt-1">Create a secure 4+ digit PIN to lock certain features for children.</p>

        <div className="mt-4 space-y-2">
          <input value={pin} onChange={e=>setPin(e.target.value)} placeholder="Enter PIN" className="w-full p-2 border rounded" />
          <input value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Confirm PIN" className="w-full p-2 border rounded" />
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 rounded border">Cancel</button>
          <button onClick={handleSetup} className="px-3 py-1 rounded bg-indigo-600 text-white">{loading ? 'Saving...' : 'Set PIN'}</button>
        </div>
      </div>
    </div>
  );
}