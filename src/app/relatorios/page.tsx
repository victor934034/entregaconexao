'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { BarChart2, CheckCircle } from 'lucide-react';

export default function Relatorios() {
    const [ranking, setRanking] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const carregar = async () => {
            try {
                const response = await api.get('/relatorios/entregadores');
                setRanking(response.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        carregar();
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Relatórios Gerenciais</h2>
                <p className="text-gray-500">Desempenho da equipe e métricas de sucesso.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-blue-50 flex items-center gap-2">
                    <BarChart2 className="text-blue-700" size={20} />
                    <h3 className="font-semibold text-blue-900">Ranking de Entregadores</h3>
                </div>
                <div className="p-6">
                    {ranking.length > 0 ? (
                        <div className="space-y-4">
                            {ranking.map((ent, idx) => (
                                <div key={ent.entregador_id} className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-300">
                                    <div className="flex items-center gap-4">
                                        <span className="text-2xl font-bold text-gray-300 w-8">{idx + 1}º</span>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-lg">{ent.entregador?.nome || 'Desconhecido'}</p>
                                            <p className="text-sm text-gray-500">ID: {ent.entregador_id}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1 text-green-600 font-bold text-xl">
                                            {ent.total_entregas} <CheckCircle size={20} />
                                        </div>
                                        <p className="text-sm text-gray-500">Entregues</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">Nenhum dado de ranking disponível.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
