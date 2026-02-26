'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Truck, MapPin } from 'lucide-react';

export default function Entregadores() {
    const [entregadores, setEntregadores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const carregar = async () => {
            try {
                const response = await api.get('/usuarios');
                const filtrados = response.data.filter((u: any) => u.perfil === 'ENTREGADOR');
                setEntregadores(filtrados);
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
                <h2 className="text-2xl font-bold text-gray-900">Entregadores em Campo</h2>
                <p className="text-gray-500">Membros da equipe de logística e suas rotas ativas.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {entregadores.map(ent => (
                    <div key={ent.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center hover:border-blue-400 transition-colors">
                        <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mb-4">
                            <Truck size={32} />
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg mb-1">{ent.nome}</h3>
                        <p className="text-sm text-gray-500 mb-4">{ent.email}</p>

                        <div className="w-full pt-4 border-t border-gray-100 flex justify-center gap-2 text-sm text-gray-600">
                            <MapPin size={18} /> Monitorar Rota no App Android
                        </div>
                    </div>
                ))}
            </div>

            {entregadores.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
                    Nenhum entregador cadastrado.
                </div>
            )}
        </div>
    );
}
