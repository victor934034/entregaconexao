'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/hooks/useSocket';
import api from '@/lib/api';
import Link from 'next/link';
import { Plus, Search, FileText } from 'lucide-react';

export default function Pedidos() {
    const { usuario } = useAuth();
    const socket = useSocket();
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtroStatus, setFiltroStatus] = useState('');

    const carregarPedidos = async () => {
        try {
            const response = await api.get('/pedidos?status=' + filtroStatus);
            setPedidos(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarPedidos();
    }, [usuario, filtroStatus]);

    useEffect(() => {
        if (socket) {
            const atualizar = () => carregarPedidos();
            socket.on('pedido:criado', atualizar);
            socket.on('pedido:status', atualizar);
            return () => {
                socket.off('pedido:criado', atualizar);
                socket.off('pedido:status', atualizar);
            };
        }
    }, [socket]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDENTE': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'EM_ROTA': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'ENTREGUE': return 'bg-green-100 text-green-800 border-green-200';
            case 'CANCELADO': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Pedidos</h2>
                    <p className="text-gray-500">Lista completa das entregas e status.</p>
                </div>

                <div className="flex gap-2">
                    <Link
                        href="/pedidos/novo"
                        className="bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-800 transition-colors"
                    >
                        <Plus size={18} /> Novo Pedido
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por Nº Pedido ou Cliente..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                    </div>

                    <select
                        value={filtroStatus}
                        onChange={(e) => setFiltroStatus(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                        <option value="">Todos os status</option>
                        <option value="PENDENTE">Pendente</option>
                        <option value="EM_ROTA">Em Rota</option>
                        <option value="ENTREGUE">Entregue</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left bg-white">
                        <thead className="bg-blue-50 text-blue-900 text-sm font-semibold border-b border-blue-100">
                            <tr>
                                <th className="py-3 px-4">Nº Pedido</th>
                                <th className="py-3 px-4">Cadastro</th>
                                <th className="py-3 px-4">Entrega Programada</th>
                                <th className="py-3 px-4">Cliente</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pedidos.map(pedido => (
                                <tr key={pedido.id} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                                    <td className="py-3 px-4 font-medium text-gray-900">#{pedido.numero_pedido}</td>
                                    <td className="py-3 px-4 text-gray-600 text-xs">{new Date(pedido.data_pedido).toLocaleDateString()}</td>
                                    <td className="py-3 px-4">
                                        {pedido.data_entrega_programada ? (
                                            <div className="text-blue-700 font-semibold">
                                                {new Date(pedido.data_entrega_programada + 'T12:00:00').toLocaleDateString()}
                                                {pedido.hora_entrega_programada && <span className="ml-2 text-xs font-normal">às {pedido.hora_entrega_programada}</span>}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-xs italic">Não agendado</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-gray-800">{pedido.nome_cliente}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(pedido.status)}`}>
                                            {pedido.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <Link
                                            href={`/pedidos/${pedido.id}`}
                                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                        >
                                            Detalhes
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {pedidos.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-500">
                                        Nenhum pedido encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
