// SignalProtocolStore.js
// IndexedDB-backed Signal Protocol Store for libsignal
// Place at: src/libsignal/SignalProtocolStore.js
//
// Usage:
//   import SignalProtocolStore from './SignalProtocolStore';
//   const store = new SignalProtocolStore('muse-signal-store');
//   await store.open();
//   await store.setIdentityKeyPair(identityKeyPair);
//   await store.storePreKey(keyId, { pubKey, privKey });
//   // ... libsignal SessionBuilder/SessionCipher uses store.get/put/remove

const DB_NAME = "muse_signal_db";
const DB_VERSION = 1;
const STORE_NAME = "keyvalue";

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet(db, key) {
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const s = tx.objectStore(STORE_NAME);
    const r = s.get(key);
    r.onsuccess = () => res(r.result === undefined ? null : r.result);
    r.onerror = () => rej(r.error);
  });
}
function idbPut(db, key, value) {
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const s = tx.objectStore(STORE_NAME);
    s.put(value, key);
    tx.oncomplete = () => res(true);
    tx.onerror = () => rej(tx.error);
  });
}
function idbDelete(db, key) {
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const s = tx.objectStore(STORE_NAME);
    s.delete(key);
    tx.oncomplete = () => res(true);
    tx.onerror = () => rej(tx.error);
  });
}

export default class SignalProtocolStore {
  constructor(namespace = "muse") {
    this.ns = namespace; // prefix for keys
    this.db = null;
    this._openPromise = null;
  }

  async open() {
    if (this.db) return this.db;
    if (!this._openPromise) this._openPromise = openDb();
    this.db = await this._openPromise;
    return this.db;
  }

  _key(k) {
    return `${this.ns}:${k}`;
  }

  // Generic get/put/remove used by libsignal store adapter
  async get(k, defaultValue = null) {
    await this.open();
    const v = await idbGet(this.db, this._key(k));
    return v === undefined || v === null ? defaultValue : v;
  }
  async put(k, v) {
    await this.open();
    await idbPut(this.db, this._key(k), v);
    return true;
  }
  async remove(k) {
    await this.open();
    await idbDelete(this.db, this._key(k));
    return true;
  }

  // ---- Identity keypair ----
  async setIdentityKeyPair(identityKeyPair) {
    // identityKeyPair: { pubKey: ArrayBuffer/Uint8Array, privKey: ArrayBuffer/Uint8Array } OR libsignal KeyPair
    // We store as base64 strings to keep IndexedDB stable
    const toB64 = (ab) => {
      if (!ab) return null;
      const u8 = ab instanceof Uint8Array ? ab : new Uint8Array(ab);
      let s = "";
      for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
      return btoa(s);
    };
    const data = {
      pubKey: toB64(identityKeyPair.pubKey),
      privKey: toB64(identityKeyPair.privKey),
    };
    await this.put("identityKey", data);
  }

  async getIdentityKeyPair() {
    const data = await this.get("identityKey", null);
    if (!data) return null;
    const fromB64 = (s) => {
      if (!s) return null;
      const bin = atob(s);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return arr.buffer;
    };
    return {
      pubKey: fromB64(data.pubKey),
      privKey: fromB64(data.privKey),
    };
  }

  // ---- RegistrationId ----
  async setLocalRegistrationId(regId) {
    await this.put("registrationId", Number(regId));
  }
  async getLocalRegistrationId() {
    return await this.get("registrationId", 0);
  }

  // ---- Prekeys (one-time prekeys) ----
  // We'll store prekeys in individual keys: prekey:<id> => { pub, priv }
  async storePreKey(keyId, keyPair) {
    // keyPair expected: { pubKey: ArrayBuffer/Uint8Array, privKey: ArrayBuffer/Uint8Array }
    const toB64 = (ab) => {
      if (!ab) return null;
      const u8 = ab instanceof Uint8Array ? ab : new Uint8Array(ab);
      let s = "";
      for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
      return btoa(s);
    };
    const obj = {
      pub: toB64(keyPair.pubKey || keyPair.pub),
      priv: toB64(keyPair.privKey || keyPair.priv),
    };
    await this.put(`prekey:${keyId}`, obj);
  }
  async loadPreKey(keyId) {
    const obj = await this.get(`prekey:${keyId}`, null);
    if (!obj) return null;
    const fromB64 = (s) => {
      if (!s) return null;
      const bin = atob(s);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return arr.buffer;
    };
    return { pubKey: fromB64(obj.pub), privKey: fromB64(obj.priv) };
  }
  async removePreKey(keyId) {
    await this.remove(`prekey:${keyId}`);
  }

  // Convenience: list all stored one-time prekey ids (scan keys)
  async listPreKeyIds() {
    await this.open();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, "readonly");
      const s = tx.objectStore(STORE_NAME);
      const req = s.openCursor();
      const ids = [];
      req.onsuccess = (ev) => {
        const cursor = ev.target.result;
        if (!cursor) {
          resolve(ids);
          return;
        }
        const key = cursor.key;
        if (typeof key === "string" && key.startsWith(this._key("prekey:"))) {
          const k = key.slice(this._key("prekey:").length);
          ids.push(Number(k));
        }
        cursor.continue();
      };
      req.onerror = () => reject(req.error);
    });
  }

  // ---- Signed PreKey ----
  async storeSignedPreKey(keyId, keyPair) {
    const toB64 = (ab) => {
      if (!ab) return null;
      const u8 = ab instanceof Uint8Array ? ab : new Uint8Array(ab);
      let s = "";
      for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
      return btoa(s);
    };
    const obj = {
      keyId: Number(keyId),
      pub: toB64(keyPair.pubKey || keyPair.pub),
      priv: toB64(keyPair.privKey || keyPair.priv),
    };
    await this.put("signedPreKey", obj);
  }
  async loadSignedPreKey() {
    const obj = await this.get("signedPreKey", null);
    if (!obj) return null;
    const fromB64 = (s) => {
      if (!s) return null;
      const bin = atob(s);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return arr.buffer;
    };
    return {
      keyId: obj.keyId,
      pubKey: fromB64(obj.pub),
      privKey: fromB64(obj.priv),
    };
  }

  // ---- Session store (libsignal expects string keys for sessions) ----
  // We simply store session record objects as-is (libsignal produces buffer/Uint8Array; store as base64)
  async storeSession(address, record) {
    // address string like 'userId:deviceId' or libsignal Address object key
    await this.put(`session:${address}`, record);
  }
  async loadSession(address) {
    return await this.get(`session:${address}`, null);
  }
  async removeSession(address) {
    await this.remove(`session:${address}`);
  }

  // ---- Identity (trusted keys) ----
  // simple mapping: identity::<address> => pubkey (b64)
  async saveIdentity(address, pubKey) {
    // pubKey is ArrayBuffer/Uint8Array
    const toB64 = (ab) => {
      if (!ab) return null;
      const u8 = ab instanceof Uint8Array ? ab : new Uint8Array(ab);
      let s = "";
      for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
      return btoa(s);
    };
    await this.put(`identity:${address}`, toB64(pubKey));
  }
  async isTrustedIdentity(address, pubKey) {
    const fromB64 = (s) => {
      if (!s) return null;
      const bin = atob(s);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return arr.buffer;
    };
    const storedB64 = await this.get(`identity:${address}`, null);
    if (!storedB64) return true; // unknown => trust (first time)
    const stored = fromB64(storedB64);
    const newBuf =
      pubKey instanceof ArrayBuffer ? pubKey : pubKey.buffer || pubKey;
    // compare bytewise
    if (!stored || !newBuf) return false;
    const a = new Uint8Array(stored);
    const b = new Uint8Array(newBuf);
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  // Small helper to clear everything (dev)
  async clearAll() {
    await this.open();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, "readwrite");
      const s = tx.objectStore(STORE_NAME);
      const r = s.clear();
      r.onsuccess = () => resolve(true);
      r.onerror = () => reject(r.error);
    });
  }
}
