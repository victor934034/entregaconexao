'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Usuario {
    id: number;
    nome: string;
    email: string;
    perfil: string;
}

interface AuthContextData {
    usuario: Usuario | null;
    isAuthenticated: boolean;
    login: (token: string, userData: Usuario) => void;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function loadStorageData() {
            const token = localStorage.getItem('@Conexao:token');
            const userStr = localStorage.getItem('@Conexao:user');

            if (token && userStr) {
                setUsuario(JSON.parse(userStr));
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }
            setLoading(false);
        }
        loadStorageData();
    }, []);

    const login = (token: string, userData: Usuario) => {
        localStorage.setItem('@Conexao:token', token);
        localStorage.setItem('@Conexao:user', JSON.stringify(userData));
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUsuario(userData);
        router.push('/dashboard');
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error(error);
        } finally {
            localStorage.removeItem('@Conexao:token');
            localStorage.removeItem('@Conexao:user');
            delete api.defaults.headers.common['Authorization'];
            setUsuario(null);
            router.push('/login');
        }
    };

    return (
        <AuthContext.Provider value={{ usuario, isAuthenticated: !!usuario, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export function useAuth() {
    const context = useContext(AuthContext);
    return context;
}
