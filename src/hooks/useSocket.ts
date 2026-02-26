'use client';

import { useEffect } from 'react';
import { socket } from '@/lib/socket';
import { useAuth } from '@/contexts/AuthContext';

export const useSocket = () => {
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            socket.connect();

            socket.on('connect', () => {
                console.log('Conectado ao socket em tempo real');
            });

            return () => {
                socket.disconnect();
            };
        }
    }, [isAuthenticated]);

    return socket;
};
