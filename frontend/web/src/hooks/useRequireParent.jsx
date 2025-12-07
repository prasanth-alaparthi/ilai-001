// src/hooks/useRequireParent.jsx
import { useState } from 'react';
import PinVerifyModal from '../components/parental/PinVerifyModal';

export default function useRequireParent() {
  const [showVerify, setShowVerify] = useState(false);
  const [onVerifiedCb, setOnVerifiedCb] = useState(null);

  function requireParent(cb) {
    setOnVerifiedCb(() => cb);
    setShowVerify(true);
  }

  function handleVerified() {
    if (onVerifiedCb) onVerifiedCb();
    setShowVerify(false);
  }

  function Modal() {
    return showVerify ? <PinVerifyModal onClose={() => setShowVerify(false)} onVerified={handleVerified} /> : null;
  }

  return { requireParent, Modal };
}
