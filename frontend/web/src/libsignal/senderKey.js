// src/libsignal/senderKey.js
import * as libsignal from "@wireapp/proteus";
import apiClient from "../services/apiClient";
import { getSignalStore, arrayBufferToBase64 } from "./signalHelpers";

export async function createAndDistributeSenderKey(
  localDeviceId,
  senderUserId,
  groupId,
  members
) {
  // members: [{ userId, deviceId }, ...]
  // generate random sender key (32 bytes)
  const key = window.crypto.getRandomValues(new Uint8Array(32));
  const keyB64 = arrayBufferToBase64(key);

  const envelopes = [];
  const store = getSignalStore();

  // For each member device, encrypt the sender key using libsignal SessionCipher
  for (const m of members) {
    const sessionCipher = new libsignal.SessionCipher(
      store,
      `${m.userId}:${m.deviceId}`
    );
    // encrypt (returns PreKeySignalMessage or SignalMessage; wrapper uses ArrayBuffer)
    const ciphertext = await sessionCipher.encrypt(key);
    // ciphertext has .type and .body (ArrayBuffer)
    const body = ciphertext.body || ciphertext; // depends on lib version
    const bodyB64 = arrayBufferToBase64(new Uint8Array(body));
    envelopes.push({
      targetUserId: m.userId,
      targetDeviceId: m.deviceId,
      envelope: bodyB64,
    });
  }

  // POST to server
  await apiClient.post(`/v1/groups/${groupId}/senderkey`, { envelopes });

  // store the sender key locally for sending in group messages
  await store.put(
    `group:senderkey:${groupId}`,
    { key: keyB64, keyId: Date.now() }
  );
  return { key: keyB64, keyId: Date.now() };
}

export async function fetchAndConsumeEnvelopes(
  groupId,
  userId,
  deviceId,
  localDeviceId
) {
  const res = await apiClient.get(
    `/v1/groups/${groupId}/envelopes?deviceId=${deviceId}`
  );
  const envelopes = res.data.envelopes || [];
  const store = getSignalStore();
  const sessionCipher = new libsignal.SessionCipher(
    store /* sender address is unknown; lib will figure from PreKey message */
  );
  for (const e of envelopes) {
    const body = Uint8Array.from(atob(e.envelope), (c) =>
      c.charCodeAt(0)
    ).buffer;
    // Try prekey decrypt first
    try {
      const pt = await sessionCipher.decryptPreKeyWhisperMessage(body);
      // pt is ArrayBuffer key bytes -> store as base64
      const keyB64 = arrayBufferToBase64(pt);
      await store.put(
        `group:senderkey:${e.group_id}`,
        { key: keyB64, keyId: e.id }
      );
      // mark consumed
      await apiClient.post(`/v1/groups/envelopes/${e.id}/consume`);
      continue;
    } catch (ex) {
      // maybe normal message
      console.warn("PreKey decrypt failed", ex);
    }
    try {
      const pt = await sessionCipher.decryptWhisperMessage(body);
      const keyB64 = arrayBufferToBase64(pt);
      await store.put(
        `group:senderkey:${e.group_id}`,
        { key: keyB64, keyId: e.id }
      );
      await apiClient.post(`/v1/groups/envelopes/${e.id}/consume`);
    } catch (ex) {
      console.error("Envelope decryption failed", ex);
    }
  }
}
