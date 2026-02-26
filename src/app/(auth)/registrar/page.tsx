'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Truck, UserPlus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function Registrar() {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [erro, setErro] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRegistrar = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro('');

        if (senha !== confirmarSenha) {
            setErro('As senhas não coincidem.');
            return;
        }

        setLoading(true);

        try {
            await api.post('/auth/registrar', { nome, email, senha });
            // Após registrar com sucesso, redirecionar para login com mensagem de sucesso
            router.push('/login?cadastrado=true');
        } catch (err: any) {
            setErro(err.response?.data?.error || 'Erro ao realizar cadastro.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-16 h-16 bg-blue-700 text-white rounded-full flex items-center justify-center mb-4">
                        <UserPlus size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Cadastro de Entregador</h1>
                    <p className="text-gray-500 text-center">Crie sua conta para começar as entregas</p>
                </div>

                {erro && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
                        {erro}
                    </div>
                )}

                <form onSubmit={handleRegistrar} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                        <input
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                            placeholder="Seu nome"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                            placeholder="seu@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                        <input
                            type="password"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                            placeholder="••••••••"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha</label>
                        <input
                            type="password"
                            value={confirmarSenha}
                            onChange={(e) => setConfirmarSenha(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2.5 rounded-lg text-white font-medium transition-colors ${loading ? 'bg-blue-400' : 'bg-blue-700 hover:bg-blue-800'
                            }`}
                    >
                        {loading ? 'Cadastrando...' : 'Criar Conta'}
                    </button>
                </form>

                <div className="mt-6 text-center border-t pt-6">
                    <Link href="/login" className="text-gray-600 flex items-center justify-center gap-2 hover:text-blue-700 text-sm">
                        <ArrowLeft size={16} />
                        Voltar para o Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
