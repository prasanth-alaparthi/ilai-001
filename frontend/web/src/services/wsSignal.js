// src/services/wsSignal.js
// WebSocket manager for signal chat with JWT auth
const WS_PREFIX =
  window.__APP_WS_BASE__ ||
  (location.protocol === "https:" ? "wss://" : "ws://") + window.location.host;

class WS {
  constructor() {
    this.socket = null;
    this.handlers = [];
  }

  connect(token) {
    if (!token) throw new Error("JWT required for websocket");
    const url = `${WS_PREFIX}/ws/messages?token=${encodeURIComponent(token)}`;
    this.socket = new WebSocket(url);
    this.socket.onopen = () => console.log("WS connected");
    this.socket.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        for (const h of this.handlers) h(data);
      } catch (e) {
        console.error("ws parse", e);
      }
    };
    this.socket.onclose = () => console.log("WS closed");
    this.socket.onerror = (e) => console.error("WS err", e);
  }

  onMessage(fn) {
    this.handlers.push(fn);
    return () => (this.handlers = this.handlers.filter((h) => h !== fn));
  }

  send(obj) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn("ws not open");
      return;
    }
    this.socket.send(JSON.stringify(obj));
  }
}

const wsSignal = new WS();
export default wsSignal;
