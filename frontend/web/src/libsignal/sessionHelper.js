import * as libsignal from "@wireapp/proteus";
import apiClient from "../services/apiClient";
import { getSignalStore, base64ToArrayBuffer } from "./signalHelpers";

// create a Signal PreKeyBundle object from server response
function buildPreKeyBundle(device) {
  return {
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
}

// Create session with a target device (userId, targetDeviceId)
export async function createSessionWithDevice(
  localDeviceId,
  targetUserId,
  targetDeviceId
) {
  const store = getSignalStore();
  // load local store (Signal needs a store for sessions/identities)
  const local = await store.get(`signal:keys:${localDeviceId}`);
  if (!local) throw new Error("local keys not found");

  // populate identity key into store
  await store.put("identityKey", base64ToArrayBuffer(local.identityKeyPair.pubKey));
  // create session builder
  const sessionBuilder = new libsignal.SessionBuilder(
    store,
    `${targetUserId}:${targetDeviceId}`
  ); // unique address

  // fetch target prekey bundle from server
  const res = await apiClient.get(`/v1/keys/${targetUserId}`);
  const devices = res.data.devices || [];
  const target =
    devices.find((d) => d.device_id === targetDeviceId) || devices[0];
  const bundle = buildPreKeyBundle(target);

  // construct a Signal PreKeyBundle structure expected by libsignal
  const preKeyBundle = {
    identityKey: bundle.identityKey,
    registrationId: bundle.registrationId,
    preKey: bundle.preKey
      ? { keyId: bundle.preKey.keyId, publicKey: bundle.preKey.publicKey }
      : null,
    signedPreKey: bundle.signedPreKey
      ? {
        keyId: bundle.signedPreKey.keyId,
        publicKey: bundle.signedPreKey.publicKey,
      }
      : null,
    signedPreKeySignature: bundle.signedPreKeySignature,
  };

  await sessionBuilder.processPreKey(preKeyBundle);
  return true;
}
