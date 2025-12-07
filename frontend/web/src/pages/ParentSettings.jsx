
import React, { useEffect, useState } from "react";
import apiClient from "../services/apiClient";
import PinSetupModal from "../components/parental/PinSetupModal";
import PinVerifyModal from "../components/parental/PinVerifyModal";

export default function ParentSettings() {
  const [pinEnabled, setPinEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  async function fetchStatus() {
    setLoading(true);
    try {
      const res = await apiClient.get("/parental/pin/status");
      setPinEnabled(res.data?.enabled || false);
    } catch {
      setPinEnabled(false);
    } finally {
      setLoading(false);
    }
  }

  async function removePin() {
    try {
      await apiClient.post("/parental/pin/remove");
      fetchStatus();
    } catch {
      alert("Failed to remove PIN");
    }
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Parent Settings</h1>
      <p className="text-slate-600 max-w-xl">
        Manage parental controls, set a PIN, and control safe access to features
        for younger learners.
      </p>

      {loading ? (
        <div className="text-sm">Loading...</div>
      ) : (
        <div className="p-4 bg-white rounded-xl shadow-sm border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Parent PIN</div>
              <div className="text-sm text-slate-500">
                {pinEnabled ? "Parent PIN is enabled." : "Parent PIN not set."}
              </div>
            </div>

            {!pinEnabled ? (
              <button
                className="px-4 py-2 rounded-md bg-indigo-600 text-white"
                onClick={() => setShowSetupModal(true)}
              >
                Set PIN
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSetupModal(true)}
                  className="px-4 py-2 rounded-md border"
                >
                  Change PIN
                </button>
                <button
                  onClick={() => setShowVerifyModal(true)}
                  className="px-4 py-2 rounded-md bg-red-600 text-white"
                >
                  Remove PIN
                </button>
              </div>
            )}
          </div>

          <hr />

          <div className="space-y-2">
            <div className="font-medium">Safety</div>
            <p className="text-sm text-slate-500">
              All content uploaded by students goes through safety filters and
              moderation. You can control age-access.
            </p>
          </div>
        </div>
      )}

      {showSetupModal && (
        <PinSetupModal
          onClose={() => setShowSetupModal(false)}
          onDone={() => fetchStatus()}
        />
      )}

      {showVerifyModal && (
        <PinVerifyModal
          onClose={() => setShowVerifyModal(false)}
          onVerified={removePin}
        />
      )}
    </div>
  );
}