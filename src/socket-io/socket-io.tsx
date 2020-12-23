import socketIOClient from 'socket.io-client';

const ROUTE = 'http://127.0.0.1:1337/';

const s = socketIOClient(ROUTE);

export default s;
