// src/libsignal/storage.js
import { base64ToArrayBuffer, arrayBufferToBase64 } from "./signalHelpers";

function getStore() {
  const dbName = "signal-store";
  const storeName = "signal-data";
  const db = new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName, 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(storeName);
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });

  return {
    get: async (key) => {
      const db_ = await db;
      return new Promise((resolve, reject) => {
        const tx = db_.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const req = store.get(key);
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
      });
    },
    set: async (key, value) => {
      const db_ = await db;
      return new Promise((resolve, reject) => {
        const tx = db_.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const req = store.put(value, key);
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
      });
    },
    remove: async (key) => {
      const db_ = await db;
      return new Promise((resolve, reject) => {
        const tx = db_.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const req = store.delete(key);
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
      });
    },
  };
}

export class SignalProtocolStore {
  constructor() {
    this.store = getStore();
  }
  async get(key, defaultValue) {
    const val = await this.store.get(key);
    return val === undefined ? defaultValue : val;
  }
  async set(key, value) {
    return this.store.set(key, value);
  }
  async remove(key) {
    return this.store.remove(key);
  }

  // Identity methods
  async getIdentityKeyPair() {
    const kp = await this.get("identityKey");
    if (!kp) return null;
    return {
      pubKey: base64ToArrayBuffer(kp.pubKey),
      privKey: base64ToArrayBuffer(kp.privKey),
    };
  }
  async getLocalRegistrationId() {
    return this.get("registrationId");
  }
  async isTrustedIdentity(identifier, identityKey) {
    const trusted = await this.get(`identityKey:${identifier}`);
    if (!trusted) return true; // Always trust new identities
    return arrayBufferToBase64(identityKey) === trusted;
  }
  async saveIdentity(identifier, identityKey) {
    const b64 = arrayBufferToBase64(identityKey);
    await this.set(`identityKey:${identifier}`, b64);
    return true;
  }

  // PreKey methods
  async loadPreKey(keyId) {
    const res = await this.get(`preKey:${keyId}`);
    if (!res) return null;
    return {
      pubKey: base64ToArrayBuffer(res.pubKey),
      privKey: base64ToArrayBuffer(res.privKey),
    };
  }
  async storePreKey(keyId, keyPair) {
    await this.set(`preKey:${keyId}`, {
      pubKey: arrayBufferToBase64(keyPair.pubKey),
      privKey: arrayBufferToBase64(keyPair.privKey),
    });
  }
  async removePreKey(keyId) {
    await this.remove(`preKey:${keyId}`);
  }

  // Signed PreKey methods
  async loadSignedPreKey(keyId) {
    const res = await this.get(`signedPreKey:${keyId}`);
    if (!res) return null;
    return {
      pubKey: base64ToArrayBuffer(res.pubKey),
      privKey: base64ToArrayBuffer(res.privKey),
    };
  }
  async storeSignedPreKey(keyId, keyPair) {
    await this.set(`signedPreKey:${keyId}`, {
      pubKey: arrayBufferToBase64(keyPair.pubKey),
      privKey: arrayBufferToBase64(keyPair.privKey),
    });
  }
  async removeSignedPreKey(keyId) {
    await this.remove(`signedPreKey:${keyId}`);
  }

  // Session methods
  async loadSession(identifier) {
    const rec = await this.get(`session:${identifier}`);
    return rec ? base64ToArrayBuffer(rec) : null;
  }
  async storeSession(identifier, record) {
    const b64 = arrayBufferToBase64(record);
    await this.set(`session:${identifier}`, b64);
  }
  async removeSession(identifier) {
    await this.remove(`session:${identifier}`);
  }
  async removeAllSessions(identifier) {
    // This is not efficient, but it's a demo
    const allKeys = await this.store.getAllKeys();
    for (const key of allKeys) {
      if (key.startsWith(`session:${identifier}`)) {
        await this.remove(key);
      }
    }
  }
}
