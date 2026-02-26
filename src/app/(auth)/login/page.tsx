'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Truck } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
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

            // Bloquear entregador no painel web
            if (usuario.perfil === 'ENTREGADOR') {
                setErro('Acesso restrito. Entregadores devem usar o aplicativo.');
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
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-blue-700 text-white rounded-full flex items-center justify-center mb-4">
                        <Truck size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Conexão BR277</h1>
                    <p className="text-gray-500">Gestão de Entregas</p>
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
            </div>
        </div>
    );
}
