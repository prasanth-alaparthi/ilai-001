import React, { useState } from "react";
import apiClient from "../../services/apiClient";

export default function CreateConversationModal({ onClose, onCreated }) {
    const [type, setType] = useState("DIRECT");
    const [name, setName] = useState("");
    const [participantIds, setParticipantIds] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const pIds = participantIds.split(",").map(s => s.trim()).filter(Boolean);
            const payload = {
                type,
                name: type === "GROUP" ? name : undefined,
                participantIds: pIds
            };

            const res = await apiClient.post("/chat/conversations", payload);
            onCreated(res.data);
            onClose();
        } catch (err) {
            alert("Failed to create conversation: " + err.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
                <h2 className="text-xl font-bold mb-4">New Conversation</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Type</label>
                        <select
                            value={type}
                            onChange={e => setType(e.target.value)}
                            className="w-full p-2 border rounded"
                        >
                            <option value="DIRECT">Direct Message</option>
                            <option value="GROUP">Group Chat</option>
                            <option value="AI">AI Chat</option>
                        </select>
                    </div>

                    {type === "GROUP" && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Group Name</label>
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full p-2 border rounded"
                                required
                            />
                        </div>
                    )}

                    {type !== "AI" && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Participant IDs (comma separated)</label>
                            <input
                                value={participantIds}
                                onChange={e => setParticipantIds(e.target.value)}
                                className="w-full p-2 border rounded"
                                placeholder="user1, user2..."
                                required
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Create</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
