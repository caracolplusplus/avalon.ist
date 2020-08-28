import socketIO from "socket.io-client";

const end = "http://127.0.0.1:1337";
const ws = socketIO(end);

export default ws;
