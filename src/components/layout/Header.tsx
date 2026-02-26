'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User } from 'lucide-react';

export function Header() {
    const { usuario, logout } = useAuth();

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
            <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800 text-lg">Painel Administrativo</span>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 border-r border-gray-200 pr-4">
                    <User size={18} className="text-blue-600" />
                    <span className="font-medium text-gray-900">{usuario?.nome || 'Carregando...'}</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                        {usuario?.perfil}
                    </span>
                </div>

                <button
                    onClick={logout}
                    className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 transition-colors font-medium"
                >
                    <LogOut size={18} />
                    Sair
                </button>
            </div>
        </header>
    );
}
