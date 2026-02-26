'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/hooks/useSocket';
import api from '@/lib/api';
import { Package, Clock, Truck, CheckCircle } from 'lucide-react';

interface DashboardDados {
    totalHoje: number;
    pendentes: number;
    emRota: number;
    entregues: number;
}

export default function Dashboard() {
    const { usuario } = useAuth();
    const socket = useSocket();
    const [dados, setDados] = useState<DashboardDados>({
        totalHoje: 0,
        pendentes: 0,
        emRota: 0,
        entregues: 0
    });

    const loadDashboard = async () => {
        try {
            const response = await api.get('/relatorios/dashboard');
            setDados(response.data);
        } catch (error) {
            console.error('Erro ao carregar dashboard', error);
        }
    };

    useEffect(() => {
        if (usuario) {
            loadDashboard();
        }
    }, [usuario]);

    useEffect(() => {
        if (socket) {
            const handleUpdate = () => loadDashboard();
            socket.on('pedido:criado', handleUpdate);
            socket.on('pedido:atualizado', handleUpdate);
            socket.on('pedido:status', handleUpdate);
            socket.on('pedido:excluido', handleUpdate);

            return () => {
                socket.off('pedido:criado', handleUpdate);
                socket.off('pedido:atualizado', handleUpdate);
                socket.off('pedido:status', handleUpdate);
                socket.off('pedido:excluido', handleUpdate);
            };
        }
    }, [socket]);

    const cards = [
        { title: 'Pedidos Hoje', value: dados.totalHoje, icon: Package, color: 'bg-blue-50 text-blue-700', border: 'border-blue-200' },
        { title: 'Pendentes', value: dados.pendentes, icon: Clock, color: 'bg-gray-50 text-gray-700', border: 'border-gray-200' },
        { title: 'Em Rota', value: dados.emRota, icon: Truck, color: 'bg-orange-50 text-orange-600', border: 'border-orange-200' },
        { title: 'Entregues', value: dados.entregues, icon: CheckCircle, color: 'bg-green-50 text-green-700', border: 'border-green-200' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                <p className="text-gray-500">Acompanhamento em tempo real das entregas.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                        <div key={idx} className={`bg-white rounded-xl border ${card.border} p-6 shadow-sm flex items-center gap-4`}>
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.color}`}>
                                <Icon size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                                <h3 className="text-2xl font-bold text-gray-900">{card.value}</h3>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Relatório de Atividades</h3>
                <p className="text-sm text-gray-500">Carregando componentes gráficos interativos de entregas nas próximas implementações...</p>
            </div>
        </div>
    );
}
