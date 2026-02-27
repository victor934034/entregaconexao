'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { BarChart2, CheckCircle, Clock, Truck, TrendingUp, PackageSearch, Package } from 'lucide-react';

interface EntregadorRanking {
    entregador_id: number;
    entregador?: { nome: string };
    total_entregas: number;
}

interface DashboardData {
    totalHoje: number;
    pendentes: number;
    emRota: number;
    entregues: number;
}

export default function Relatorios() {
    const [ranking, setRanking] = useState<EntregadorRanking[]>([]);
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [pedidosHoje, setPedidosHoje] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const carregarTudo = async () => {
            try {
                const [rankRes, dashRes, hojeRes] = await Promise.all([
                    api.get('/relatorios/entregadores'),
                    api.get('/relatorios/dashboard'),
                    api.get('/relatorios/pedidos-dia')
                ]);
                setRanking(rankRes.data);
                setDashboard(dashRes.data);
                setPedidosHoje(hojeRes.data);
            } catch (error) {
                console.error('Erro ao carregar relatórios', error);
            } finally {
                setLoading(false);
            }
        };
        carregarTudo();
    }, []);

    const formatCurrency = (valor: number | null | undefined) => {
        if (!valor) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500 animate-pulse">Carregando métricas...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Relatórios Gerenciais</h2>
                <p className="text-gray-500">Acompanhe as métricas de sucesso e produtividade da operação em tempo real.</p>
            </div>

            {/* Dashboard Cards Gerais */}
            {dashboard && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
                        <div className="bg-blue-100 p-3 rounded-lg"><TrendingUp size={24} className="text-blue-700" /></div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Pedidos Hoje</p>
                            <h3 className="text-2xl font-bold text-gray-900">{dashboard.totalHoje}</h3>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
                        <div className="bg-orange-100 p-3 rounded-lg"><Clock size={24} className="text-orange-600" /></div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Na Fila (Pendentes)</p>
                            <h3 className="text-2xl font-bold text-gray-900">{dashboard.pendentes}</h3>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
                        <div className="bg-purple-100 p-3 rounded-lg"><Truck size={24} className="text-purple-600" /></div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Saindo p/ Entrega</p>
                            <h3 className="text-2xl font-bold text-gray-900">{dashboard.emRota}</h3>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
                        <div className="bg-green-100 p-3 rounded-lg"><CheckCircle size={24} className="text-green-600" /></div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Sucesso (Entregues)</p>
                            <h3 className="text-2xl font-bold text-gray-900">{dashboard.entregues}</h3>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Ranking */}
                <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-200 bg-blue-50 flex items-center gap-2 shrink-0">
                        <BarChart2 className="text-blue-700" size={20} />
                        <h3 className="font-semibold text-blue-900">Troféu Entregadores</h3>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto max-h-[600px]">
                        {ranking.length > 0 ? (
                            <div className="space-y-3">
                                {ranking.map((ent, idx) => (
                                    <div key={ent.entregador_id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-blue-300 transition-colors bg-white">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xl font-bold w-6 text-center ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-700' : 'text-gray-300'}`}>
                                                {idx + 1}º
                                            </span>
                                            <div>
                                                <p className="font-semibold text-gray-900">{ent.entregador?.nome || 'Desconhecido'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-2">
                                            <span className="text-green-600 font-bold text-lg">{ent.total_entregas}</span>
                                            <CheckCircle size={16} className="text-green-600" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500 h-full">
                                <PackageSearch size={48} className="mb-4 text-gray-300" />
                                <p>Nenhum entregador ranqueado no momento.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pedidos do Dia Tabela */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-2">
                            <Package className="text-gray-700" size={20} />
                            <h3 className="font-semibold text-gray-900">Entrada de Pedidos: Hoje</h3>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto max-h-[600px]">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-white sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-4 font-semibold text-gray-600 border-b">Nº Pedido</th>
                                    <th className="p-4 font-semibold text-gray-600 border-b">Cliente</th>
                                    <th className="p-4 font-semibold text-gray-600 border-b">Bairro</th>
                                    <th className="p-4 font-semibold text-gray-600 border-b">Valor Liquido</th>
                                    <th className="p-4 font-semibold text-gray-600 border-b">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {pedidosHoje.length > 0 ? (
                                    pedidosHoje.map(pedido => (
                                        <tr key={pedido.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 font-medium text-gray-900">#{pedido.numero_pedido || pedido.id}</td>
                                            <td className="p-4 text-gray-700">{pedido.nome_cliente || '-'}</td>
                                            <td className="p-4 text-gray-700">{pedido.bairro || '-'}</td>
                                            <td className="p-4 font-medium text-green-700">{formatCurrency(pedido.total_liquido)}</td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${pedido.status === 'ENTREGUE' || pedido.status === 'CONCLUIDO' ? 'bg-green-100 text-green-800' :
                                                        pedido.status === 'EM_ROTA' || pedido.status === 'AGUARDANDO' ? 'bg-purple-100 text-purple-800' :
                                                            pedido.status === 'CANCELADO' ? 'bg-red-100 text-red-800' :
                                                                'bg-orange-100 text-orange-800'
                                                    }`}>
                                                    {pedido.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-gray-500">
                                            <p className="text-lg">Sem movimento hoje.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
