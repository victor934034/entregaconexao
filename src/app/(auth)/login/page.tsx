'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Truck } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [perfil, setPerfil] = useState<'ADM' | 'ENTREGADOR'>('ADM');
    const [erro, setErro] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', { email, senha });
            const { token, usuario } = response.data;

            // Validar se o perfil bate com o selecionado (opcional para segurança visual)
            if (perfil === 'ADM' && !['SUPER_ADM', 'ADM'].includes(usuario.perfil)) {
                setErro('Este acesso é exclusivo para administradores.');
                return;
            }

            if (perfil === 'ENTREGADOR' && usuario.perfil !== 'ENTREGADOR') {
                setErro('Este acesso é exclusivo para entregadores.');
                return;
            }

            login(token, usuario);
        } catch (err: any) {
            setErro(err.response?.data?.error || 'Erro ao realizar login.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-16 h-16 bg-blue-700 text-white rounded-full flex items-center justify-center mb-4">
                        <Truck size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Conexão BR277</h1>
                    <p className="text-gray-500 text-center">Gestão de Entregas</p>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                    <button
                        onClick={() => setPerfil('ADM')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${perfil === 'ADM' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Administrador
                    </button>
                    <button
                        onClick={() => setPerfil('ENTREGADOR')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${perfil === 'ENTREGADOR' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Entregador
                    </button>
                </div>

                {erro && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
                        {erro}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                            placeholder="admin@conexaobr277.com.br"
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

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2.5 rounded-lg text-white font-medium transition-colors ${loading ? 'bg-blue-400' : 'bg-blue-700 hover:bg-blue-800'
                            }`}
                    >
                        {loading ? 'Acessando...' : 'Entrar'}
                    </button>
                </form>

                {perfil === 'ENTREGADOR' && (
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Ainda não tem conta?{' '}
                            <a href="/registrar" className="text-blue-700 font-semibold hover:underline">
                                Cadastre-se aqui
                            </a>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
