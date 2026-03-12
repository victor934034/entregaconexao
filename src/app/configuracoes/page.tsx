'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Lock, Save, Trash2, UserX } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Configuracoes() {
    const { usuario } = useAuth();
    const [senhaAtual, setSenhaAtual] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [mensagem, setMensagem] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const { logout } = useAuth();

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

    const handleDesativarConta = async () => {
        if (!window.confirm('Tem certeza que deseja desativar sua conta? Você não poderá mais acessar o sistema até que um administrador a reative.')) {
            return;
        }

        try {
            await api.patch('/usuarios/me/desativar');
            alert('Conta desativada com sucesso.');
            logout();
            router.push('/login');
        } catch (err: any) {
            setMensagem({ text: err.response?.data?.error || 'Erro ao desativar conta.', type: 'error' });
        }
    };

    const handleExcluirConta = async () => {
        if (!window.confirm('⚠️ AVISO CRÍTICO: Esta ação excluirá PERMANENTEMENTE todos os seus dados e não poderá ser desfeita. Tem certeza absoluta?')) {
            return;
        }

        try {
            await api.delete('/usuarios/me/excluir');
            alert('Sua conta foi excluída permanentemente.');
            logout();
            router.push('/login');
        } catch (err: any) {
            setMensagem({ text: err.response?.data?.error || 'Erro ao excluir conta.', type: 'error' });
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Configurações</h1>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8 border border-gray-100">
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

            <div className="bg-red-50 rounded-xl shadow-sm overflow-hidden border border-red-100">
                <div className="p-6 border-b border-red-100 bg-red-100/50">
                    <h2 className="text-lg font-semibold text-red-900 flex items-center gap-2">
                        <Trash2 className="text-red-600" size={20} />
                        Zona de Perigo
                    </h2>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">Desativar Conta</h3>
                            <p className="text-sm text-gray-600">Sua conta ficará inativa e você não poderá entrar, mas seus dados serão preservados.</p>
                        </div>
                        <button
                            onClick={handleDesativarConta}
                            className="flex items-center justify-center gap-2 border border-red-200 text-red-700 px-4 py-2 rounded-lg font-medium hover:bg-red-100 transition-colors"
                        >
                            <UserX size={18} />
                            Desativar Minha Conta
                        </button>
                    </div>

                    <div className="pt-6 border-t border-red-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-sm font-bold text-red-900">Excluir Conta</h3>
                            <p className="text-sm text-gray-600">Apaga permanentemente sua conta e todos os seus dados. Esta ação não pode ser desfeita.</p>
                        </div>
                        <button
                            onClick={handleExcluirConta}
                            className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                        >
                            <Trash2 size={18} />
                            Excluir Permanentemente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
