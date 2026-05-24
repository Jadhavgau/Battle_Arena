import { io } from "socket.io-client";

// In production, the socket connects to the same host
// In development, Vite handles the proxy or we connect to localhost:3000
const socket = io(window.location.origin, {
  autoConnect: false,
});

export default socket;
