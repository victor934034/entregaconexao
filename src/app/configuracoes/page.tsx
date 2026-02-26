'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Sidebar } from '@/components/layout/Sidebar';
import { Lock, Save } from 'lucide-react';

export default function Configuracoes() {
    const { usuario } = useAuth();
    const [senhaAtual, setSenhaAtual] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [mensagem, setMensagem] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);

    const handleAlterarSenha = async (e: React.FormEvent) => {
        e.preventDefault();
        setMensagem({ text: '', type: '' });

        if (novaSenha !== confirmarSenha) {
            setMensagem({ text: 'As senhas não coincidem.', type: 'error' });
            return;
        }

        setLoading(true);
        try {
            await api.put('/auth/alterar-senha', { senhaAtual, novaSenha });
            setMensagem({ text: 'Senha alterada com sucesso!', type: 'success' });
            setSenhaAtual('');
            setNovaSenha('');
            setConfirmarSenha('');
        } catch (err: any) {
            setMensagem({ text: err.response?.data?.error || 'Erro ao alterar senha.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />

            <main className="flex-1 p-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">Configurações</h1>

                    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
                        <div className="p-6 border-b border-gray-100 bg-gray-50">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Lock className="text-blue-600" size={20} />
                                Segurança e Senha
                            </h2>
                        </div>

                        <div className="p-6">
                            <form onSubmit={handleAlterarSenha} className="max-w-md space-y-4">
                                {mensagem.text && (
                                    <div className={`p-3 rounded-md text-sm ${mensagem.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
                                        }`}>
                                        {mensagem.text}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Senha Atual</label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                                        value={senhaAtual}
                                        onChange={e => setSenhaAtual(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                                        value={novaSenha}
                                        onChange={e => setNovaSenha(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                                        value={confirmarSenha}
                                        onChange={e => setConfirmarSenha(e.target.value)}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center justify-center gap-2 bg-blue-700 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-800 transition-colors disabled:bg-blue-400"
                                >
                                    <Save size={18} />
                                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
