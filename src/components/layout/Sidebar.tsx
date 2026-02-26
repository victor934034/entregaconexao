'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, Users, Settings, BarChart2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function Sidebar() {
    const pathname = usePathname();
    const { usuario } = useAuth();

    const links = [
        { href: '/dashboard', label: 'Dashboard', icon: Home, roles: ['SUPER_ADM', 'ADM'] },
        { href: '/pedidos', label: 'Pedidos', icon: Package, roles: ['SUPER_ADM', 'ADM'] },
        { href: '/entregadores', label: 'Entregadores', icon: Users, roles: ['SUPER_ADM', 'ADM'] },
        { href: '/usuarios', label: 'Usuários', icon: Users, roles: ['SUPER_ADM'] }, // Admin restrito via regras
        { href: '/relatorios', label: 'Relatórios', icon: BarChart2, roles: ['SUPER_ADM', 'ADM'] },
        { href: '/configuracoes', label: 'Configurações', icon: Settings, roles: ['SUPER_ADM', 'ADM'] },
    ];

    return (
        <div className="w-64 bg-blue-900 text-white min-h-screen flex flex-col">
            <div className="p-6">
                <h1 className="text-2xl font-bold tracking-tight">Conexão BR277</h1>
                <p className="text-sm text-blue-300 mt-1">Gestão de Entregas</p>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {links.map((link) => {
                    if (!usuario || !link.roles.includes(usuario.perfil)) return null;

                    const isActive = pathname.startsWith(link.href);
                    const Icon = link.icon;

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-blue-800 text-white font-medium'
                                    : 'text-blue-100 hover:bg-blue-800/50'
                                }`}
                        >
                            <Icon size={20} />
                            {link.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-blue-800 text-sm text-blue-300">
                Versão 1.1 - 2026
            </div>
        </div>
    );
}
