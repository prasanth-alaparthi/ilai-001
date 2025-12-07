// src/libsignal/signalHelpers.js
import * as libsignal from "@wireapp/proteus";
import apiClient from "../services/apiClient"; // axios
import sodium from "libsodium-wrappers";
import { SignalProtocolStore } from "./storage";

// Utility: convert ArrayBuffer <-> Base64
export function arrayBufferToBase64(b) {
  return btoa(String.fromCharCode(...new Uint8Array(b)));
}
export function base64ToArrayBuffer(s) {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0)).buffer;
}

// Global store (singleton pattern)
let signalStore = null;
export function getSignalStore() {
  if (!signalStore) {
    signalStore = new SignalProtocolStore();
  }
  return signalStore;
}

// Build a registration bundle: identityKey, signedPreKey, prekeys array
export async function generateAndRegisterSignalKeys(userId, deviceId) {
  await sodium.ready;
  // Generate identity key pair and registration id
  const identityKeyPair = await libsignal.KeyHelper.generateIdentityKeyPair();
  const registrationId = libsignal.KeyHelper.generateRegistrationId();

  // Signed PreKey
  const signedPreKeyId = Math.floor(Math.random() * 1000000);
  const signedPreKey = await libsignal.KeyHelper.generateSignedPreKey(
    identityKeyPair,
    signedPreKeyId
  );

  // Generate a set of one-time prekeys
  const preKeyCount = 50;
  const prekeys = [];
  for (let i = 0; i < preKeyCount; i++) {
    const keyId = 1000 + i;
    const pk = await libsignal.KeyHelper.generatePreKey(keyId);
    prekeys.push({
      keyId,
      publicKey: arrayBufferToBase64(pk.pubKey),
      privKey: arrayBufferToBase64(pk.privKey),
    });
  }

  // Build payload to server (public parts only)
  const payload = {
    deviceId,
    deviceName: navigator.userAgent,
    identityKey: arrayBufferToBase64(identityKeyPair.pubKey),
    registrationId,
    signedPrekey: arrayBufferToBase64(signedPreKey.keyPair.pubKey),
    signedPrekeyId: signedPreKeyId,
    signedPrekeySignature: arrayBufferToBase64(signedPreKey.signature),
    prekeys: prekeys.map((pk) => ({
      keyId: pk.keyId,
      publicKey: pk.publicKey,
    })),
  };
  // POST to server; server stores the public material
  await apiClient.post("/v1/keys/register", payload);

  // Store local private keys securely
  const local = {
    deviceId,
    identityKeyPair: {
      pubKey: arrayBufferToBase64(identityKeyPair.pubKey),
      privKey: arrayBufferToBase64(identityKeyPair.privKey),
    },
    registrationId,
    signedPreKey: {
      keyId: signedPreKeyId,
      pubKey: arrayBufferToBase64(signedPreKey.keyPair.pubKey),
      privKey: arrayBufferToBase64(signedPreKey.keyPair.privKey),
      signature: arrayBufferToBase64(signedPreKey.signature),
    },
    prekeys: prekeys, // include privKey locally for later use if needed (but usually private keys stay local)
  };
  await getSignalStore().set(`signal:keys:${deviceId}`, local);
  return local;
}

export async function loadLocalSignalKeys(deviceId) {
  const v = await getSignalStore().get(`signal:keys:${deviceId}`);
  return v ? v : null;
}
