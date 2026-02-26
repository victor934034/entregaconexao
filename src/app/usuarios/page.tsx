'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Shield, UserPlus, CheckCircle, XCircle } from 'lucide-react';

export default function Usuarios() {
    const { usuario } = useAuth();
    const [usuariosList, setUsuariosList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const carregarUsuarios = async () => {
        try {
            const response = await api.get('/usuarios');
            setUsuariosList(response.data);
        } catch (error) {
            console.error(error);
            alert('Acesso negado ou erro ao carregar.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarUsuarios();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Usuários</h2>
                    <p className="text-gray-500">Controle de acessos, ADMs e entregadores.</p>
                </div>

                <div className="flex gap-2">
                    <button
                        className="bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-800 transition-colors"
                    >
                        <UserPlus size={18} /> Novo Usuário
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left bg-white">
                        <thead className="bg-blue-50 text-blue-900 text-sm font-semibold border-b border-blue-100">
                            <tr>
                                <th className="py-3 px-4">Nome</th>
                                <th className="py-3 px-4">E-mail</th>
                                <th className="py-3 px-4">Perfil</th>
                                <th className="py-3 px-4 text-center">Status</th>
                                <th className="py-3 px-4 text-center">Permissões</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuariosList.map(u => (
                                <tr key={u.id} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                                    <td className="py-3 px-4 font-medium text-gray-900">{u.nome}</td>
                                    <td className="py-3 px-4 text-gray-600">{u.email}</td>
                                    <td className="py-3 px-4">
                                        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                            {u.perfil}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        {u.ativo ? (
                                            <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium"><CheckCircle size={16} /> Ativo</span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-red-600 text-sm font-medium"><XCircle size={16} /> Inativo</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <button className="text-blue-600 hover:text-blue-800 p-1">
                                            <Shield size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {usuariosList.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-gray-500">
                                        Nenhum usuário cadastrado.
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
