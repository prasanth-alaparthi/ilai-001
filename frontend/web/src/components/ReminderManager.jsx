// src/components/ReminderManager.jsx
import React, { useEffect, useState } from "react";
import apiClient from "../services/apiClient";
import { formatISO } from "date-fns";

export default function ReminderManager({ journalId }) {
  const [reminders, setReminders] = useState([]);
  const [when, setWhen] = useState("");
  const [message, setMessage] = useState("");

  useEffect(()=> { load(); }, []);

  async function load() {
    const res = await apiClient.get("/reminders");
    setReminders(res.data || []);
  }

  async function create() {
    if (!when) return alert("Pick date/time in ISO format");
    try {
      const payload = { remindAt: formatISO(new Date(when)), message, journalId: journalId ? String(journalId) : null };
      await apiClient.post("/reminders", payload);
      setWhen(""); setMessage("");
      load();
      // try to request notification permission
      if (Notification && Notification.permission !== "granted") {
        Notification.requestPermission();
      }
    } catch (e) { console.error(e); alert("Failed to create reminder"); }
  }

  async function del(id) {
    try { await apiClient.delete(`/reminders/${id}`); load(); } catch (e) { console.error(e); }
  }

  return (
    <div className="p-3 border rounded">
      <h4 className="font-semibold mb-2">Reminders</h4>
      <div className="flex gap-2 items-center mb-3">
        <input type="datetime-local" value={when} onChange={e=>setWhen(e.target.value)} className="px-2 py-1 rounded border" />
        <input placeholder="Message" value={message} onChange={e=>setMessage(e.target.value)} className="px-2 py-1 rounded border" />
        <button className="px-3 py-1 rounded bg-indigo-600 text-white" onClick={create}>Create</button>
      </div>
      <div className="space-y-2">
        {reminders.map(r => (
          <div key={r.id} className="flex items-center justify-between p-2 border rounded">
            <div>
              <div className="text-sm">{new Date(r.remindAt).toLocaleString()}</div>
              <div className="text-xs text-slate-500">{r.message}</div>
            </div>
            <div>
              <button className="px-2 py-1 rounded border" onClick={()=>del(r.id)}>Delete</button>
            </div>
          </div>
        ))}
        {reminders.length === 0 && <div className="text-sm text-gray-500">No reminders</div>}
      </div>
    </div>
  );
}
