// src/libsignal/sendMessage.js
import * as libsignal from "@wireapp/proteus";
import apiClient from "../services/apiClient";
import { getSignalStore } from "./signalHelpers";

export async function sendSignalMessage(
  localDeviceId,
  senderUserId,
  recipientUserId,
  recipientDeviceId,
  plaintext
) {
  const store = getSignalStore();

  // SessionCipher expects recipient address as well (matching session builder)
  const sessionCipher = new libsignal.SessionCipher(
    store,
    `${recipientUserId}:${recipientDeviceId}`
  );

  // encrypt message
  const ciphertextMsg = await sessionCipher.encrypt(plaintext);
  // ciphertextMsg can be a pre-key signal message (type 3) or a normal message (type 1)
  // Convert ciphertext to base64
  let body;
  if (ciphertextMsg.type === 3) {
    // PreKeySignalMessage has .body (ArrayBuffer)
    body = btoa(String.fromCharCode(...new Uint8Array(ciphertextMsg.body)));
  } else {
    body = btoa(String.fromCharCode(...new Uint8Array(ciphertextMsg.body)));
  }

  // send to server (server stores ciphertext and metadata header)
  const payload = {
    conversationId: null,
    senderDeviceId: localDeviceId,
    ciphertext: body,
    ciphertextVersion: "libsignal-v1",
    metadata: {
      toUser: recipientUserId,
      toDevice: recipientDeviceId,
      type: ciphertextMsg.type,
    },
  };

  await apiClient.post("/v1/messages/send", payload);
}

export async function receiveSignalMessage(msg, localDeviceId) {
  const metadata = msg.metadata || {};
  const type = metadata.type || 1;
  const senderUserId = metadata.fromUser;
  const senderDeviceId = metadata.fromDevice;

  const store = getSignalStore();
  const sessionCipher = new libsignal.SessionCipher(
    store,
    `${senderUserId}:${senderDeviceId}`
  );

  // body is base64 string of ArrayBuffer
  const bytes = Uint8Array.from(atob(msg.ciphertext), (c) =>
    c.charCodeAt(0)
  ).buffer;

  let decrypted;
  if (type === 3) {
    // PreKeySignalMessage
    decrypted = await sessionCipher.decryptPreKeyWhisperMessage(bytes);
  } else {
    decrypted = await sessionCipher.decryptWhisperMessage(bytes);
  }

  return new TextDecoder().decode(decrypted);
}
