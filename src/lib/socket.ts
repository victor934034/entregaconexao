import { io } from 'socket.io-client';

const URL = 'https://app-backend.zdc13k.easypanel.host';

export const socket = io(URL, {
    autoConnect: false,
    transports: ['websocket', 'polling'] // Garantir suporte a ambos
});
