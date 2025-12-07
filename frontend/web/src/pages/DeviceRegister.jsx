// src/pages/DeviceRegister.jsx
import React, { useEffect, useState } from 'react';
import { generateX25519Keypair, ready } from '../utils/Crypto';
import api from '../services/api';

function storeLocalKeys(deviceId, keys) {
  // WARNING: localStorage is not the most secure; use IndexedDB/secure storage in prod
  localStorage.setItem(`chat:${deviceId}:keys`, JSON.stringify(keys));
}

function loadLocalKeys(deviceId) {
  const v = localStorage.getItem(`chat:${deviceId}:keys`);
  return v ? JSON.parse(v) : null;
}

export default function DeviceRegister({ deviceId = 'web-' + Math.floor(Math.random() * 10000) }) {
  const [status, setStatus] = useState('idle');
  const [keys, setKeys] = useState(null);

  useEffect(() => {
    ready();
    const local = loadLocalKeys(deviceId);
    if (local) setKeys(local);
  }, [deviceId]);

  async function createAndRegister() {
    setStatus('generating');
    await ready();
    const kp = generateX25519Keypair();
    const payload = {
      deviceId,
      deviceName: 'Web ' + window.navigator.userAgent,
      identityKey: kp.publicKey,
      // For minimal approach, we don't create signed prekeys or one-time prekeys here.
      signedPrekey: null,
      signedPrekeySig: null,
      prekeys: []
    };
    setStatus('registering');
    try {
      await api.post('/v1/keys/register', payload);
      storeLocalKeys(deviceId, { ...kp, deviceId });
      setKeys({ ...kp, deviceId });
      setStatus('registered');
      alert('Device registered');
    } catch (e) {
      console.error(e);
      setStatus('error');
      alert('Register failed: ' + (e?.response?.data?.error || e.message));
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold">Device Registration</h2>
      <p className="text-sm text-slate-600">Device ID: {deviceId}</p>

      {keys ? (
        <div className="mt-4 p-3 bg-white rounded shadow">
          <div><strong>Registered</strong></div>
          <div className="text-xs mt-2">Public key (identity):</div>
          <div className="text-xs break-all">{keys.publicKey}</div>
          <div className="mt-3">
            <button onClick={() => { navigator.clipboard.writeText(keys.publicKey); alert('copied'); }} className="px-3 py-1 bg-indigo-600 text-white rounded">Copy public key</button>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <button onClick={createAndRegister} className="px-4 py-2 bg-indigo-600 text-white rounded">{status === 'generating' ? 'Generating...' : 'Generate & Register Device'}</button>
        </div>
      )}
    </div>
  );
}
