// src/libsignal/sessionManager.js
import * as libsignal from "@wireapp/proteus";
import api from "../services/apiClient";
import {
  getSignalStore,
  base64ToArrayBuffer,
  arrayBufferToBase64,
} from "./signalHelpers";

/**
 * sessionManager:
 * - createSession(localDeviceId, targetUserId, targetDeviceId)
 * - encryptMessage(localDeviceId, targetUserId, targetDeviceId, plaintext)
 * - decryptMessage(localDeviceId, senderUserId, senderDeviceId, ciphertextBase64, type)
 *
 * NOTE: this code assumes SignalProtocolStore exposes needed set/get helpers
 */

function addressFor(userId, deviceId) {
  return new libsignal.SignalProtocolAddress(userId, deviceId);
}

export async function createSession(
  localDeviceId,
  targetUserId,
  targetDeviceId
) {
  const store = getSignalStore();

  // build SessionBuilder for that address
  const address = addressFor(targetUserId, targetDeviceId);
  const sessionBuilder = new libsignal.SessionBuilder(store, address);

  // fetch target prekey bundle from server
  const res = await api.get(`/v1/keys/${targetUserId}`);
  const devices = res.data.devices || [];
  const device =
    devices.find((d) => d.device_id === targetDeviceId) || devices[0];
  if (!device) throw new Error("target device not found");

  // build prekey bundle in the format libsignal expects
  const preKeyBundle = {
    identityKey: base64ToArrayBuffer(device.identity_key),
    registrationId: device.registration_id ? Number(device.registration_id) : 0,
    preKey:
      device.prekeys && device.prekeys.length
        ? {
            keyId: device.prekeys[0].keyId,
            publicKey: base64ToArrayBuffer(device.prekeys[0].publicKey),
          }
        : null,
    signedPreKey: device.signed_prekey
      ? {
          keyId: device.signed_prekey_id || 1,
          publicKey: base64ToArrayBuffer(device.signed_prekey),
        }
      : null,
    signedPreKeySignature: device.signed_prekey_signature
      ? base64ToArrayBuffer(device.signed_prekey_signature)
      : null,
  };

  // process preKey bundle to establish session
  await sessionBuilder.processPreKey(preKeyBundle);

  return true;
}

export async function encryptToDevice(
  localDeviceId,
  targetUserId,
  targetDeviceId,
  plaintext
) {
  const store = getSignalStore();
  const address = addressFor(targetUserId, targetDeviceId);
  const sessionCipher = new libsignal.SessionCipher(store, address);

  // libsignal returns ciphertext object
  const cipherObj = await sessionCipher.encrypt(plaintext);
  // cipherObj.type and body (ArrayBuffer)
  const body = cipherObj.body || cipherObj.ciphertext || cipherObj; // compatibility
  const bodyB64 = arrayBufferToBase64(body);
  return { bodyB64, type: cipherObj.type || 1 };
}

export async function decryptFromDevice(
  localDeviceId,
  senderUserId,
  senderDeviceId,
  ciphertextBase64,
  type
) {
  const store = getSignalStore();
  const address = addressFor(senderUserId, senderDeviceId);
  const sessionCipher = new libsignal.SessionCipher(store, address);

  const arr = base64ToArrayBuffer(ciphertextBase64);

  let plain;
  if (type === 3) {
    // prekey message
    const decrypted = await sessionCipher.decryptPreKeyWhisperMessage(arr);
    plain = new TextDecoder().decode(decrypted);
  } else {
    const decrypted = await sessionCipher.decryptWhisperMessage(arr);
    plain = new TextDecoder().decode(decrypted);
  }
  return plain;
}
