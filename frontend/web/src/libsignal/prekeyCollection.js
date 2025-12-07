// prekeyCollection.js
// Helper utilities to manage one-time prekeys in SignalProtocolStore
// Place at: src/libsignal/prekeyCollection.js
//
// Exports:
//  - exportPublicPrekeys(store) -> [{ keyId, publicKey (base64) }, ...]
//  - consumeLocalPrekey(store, keyId) -> removes private prekey from local store (used when consumed locally)
//  - generateAndStorePrekeys(store, libsignal, startId, count) -> generates prekeys and stores private parts in store and returns public entries for server registration

// import SignalProtocolStore from "../libsignal/signalProtocolStore";

function arrayBufferToBase64(buffer) {
  const u8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let s = "";
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
  return btoa(s);
}


export async function exportPublicPrekeys(store) {
  // returns list of { keyId, publicKey (base64) } for server registration
  const ids = await store.listPreKeyIds();
  const result = [];
  for (const id of ids) {
    const kp = await store.loadPreKey(id);
    if (!kp || !kp.pubKey) continue;
    result.push({
      keyId: Number(id),
      publicKey: arrayBufferToBase64(kp.pubKey),
    });
  }
  return result;
}

export async function consumeLocalPrekey(store, keyId) {
  // remove private part locally (we keep public maybe)
  await store.remove(`prekey:${keyId}`); // underlying store uses this key naming
}

// generate prekeys using libsignal helpers and store them in store
export async function generateAndStorePrekeys(
  store,
  libsignal,
  startId = 1000,
  count = 20
) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const keyId = startId + i;
    const pre = await libsignal.KeyHelper.generatePreKey(keyId);
    // pre has {pubKey, privKey} or similar depending on lib
    await store.storePreKey(keyId, {
      pubKey: pre.pubKey || pre.pubKey,
      privKey: pre.privKey || pre.privKey,
    });
    out.push({ keyId, publicKey: arrayBufferToBase64(pre.pubKey) });
  }
  return out;
}
