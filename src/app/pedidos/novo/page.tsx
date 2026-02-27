'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Upload, Save, AlertCircle } from 'lucide-react';

export default function NovoPedido() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const [form, setForm] = useState({
        numero_pedido: '',
        data_pedido: '',
        nome_cliente: '',
        telefone_cliente: '',
        estado: 'PR',
        cidade: 'Curitiba',
        bairro: '',
        logradouro: '',
        numero_end: '',
        total_liquido: '',
        forma_pagamento: '',
        itens: [] as any[],
    });

    const [warnings, setWarnings] = useState<string[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleImportPDF = async () => {
        if (!file) return alert('Selecione um arquivo PDF.');

        setLoading(true);
        setWarnings([]);
        const formData = new FormData();
        formData.append('pdf', file);

        try {
            const response = await api.post('/pedidos/importar-pdf', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            const data = response.data;
            const newWarnings: string[] = [];

            const verifyTrust = (field: any, name: string) => {
                if (field?.confianca === 'baixa') {
                    newWarnings.push(`Por favor verifique o campo: ${name}`);
                }
                return field?.value || '';
            };

            setForm({
                ...form,
                numero_pedido: verifyTrust(data.numeroPedido, 'Número do Pedido'),
                data_pedido: verifyTrust(data.dataPedido, 'Data do Pedido'),
                nome_cliente: verifyTrust(data.nomeCliente, 'Nome do Cliente'),
                telefone_cliente: verifyTrust(data.telefoneCliente, 'Telefone do Cliente'),
                total_liquido: verifyTrust(data.totalLiquido, 'Total Líquido'),
                forma_pagamento: verifyTrust(data.formaPagamento, 'Forma de Pagamento'),
                logradouro: data.endereco?.logradouro || '',
                numero_end: data.endereco?.numero || '',
                bairro: data.endereco?.bairro || '',
                itens: data.itens || [],
            });

            setWarnings(newWarnings);
            // ALERTA REMOVIDO A PEDIDO DO USUÁRIO
        } catch (error) {
            console.error(error);
            alert('Erro ao importar PDF.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Normalização de Dados antes de enviar para o backend
            const formNormalizado = { ...form };

            // 1. Normalizar Total Líquido (de "854,59" para 854.59)
            if (typeof formNormalizado.total_liquido === 'string') {
                formNormalizado.total_liquido = formNormalizado.total_liquido.replace(',', '.').replace(/[^\d.]/g, '');
            }

            // 2. Normalizar Data (de "26/fev/2026" para Date objeto ou ISO)
            // Se falhar a conversão manual, o Sequelize pode dar erro, então tentamos limpar
            let dataFinal = formNormalizado.data_pedido;
            const meses: { [key: string]: string } = {
                'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04', 'mai': '05', 'jun': '06',
                'jul': '07', 'ago': '08', 'set': '09', 'out': '10', 'nov': '11', 'dez': '12'
            };

            Object.keys(meses).forEach(mes => {
                if (dataFinal.toLowerCase().includes(mes)) {
                    dataFinal = dataFinal.toLowerCase().replace(mes, meses[mes]);
                }
            });

            // Tenta converter "26/02/2026 18:42" -> ISO
            const dateMatch = dataFinal.match(/(\d{2})\/(\d{2})\/(\d{4})/);
            if (dateMatch) {
                formNormalizado.data_pedido = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
            } else {
                // Fallback para data atual se estiver muito bagunçado
                formNormalizado.data_pedido = new Date().toISOString();
            }

            await api.post('/pedidos', formNormalizado);
            alert('Pedido criado com sucesso!');
            router.push('/pedidos');
        } catch (error) {
            console.error(error);
            alert('Erro ao criar pedido.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Novo Pedido</h2>
                <p className="text-gray-500">Cadastre um pedido manual ou importe via PDF na área azul.</p>
            </div>

            <div className="bg-blue-50 border-2 border-dashed border-blue-400 rounded-xl p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-blue-500 mb-4" />
                <h3 className="text-lg font-medium text-blue-900 mb-2">Importar PDF do Sistema Principal</h3>
                <p className="text-sm text-blue-700 mb-4">O formulário será preenchido automaticamente ao enviar.</p>

                <div className="flex justify-center gap-4">
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="block w-full max-w-xs text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-100 file:text-blue-700
              hover:file:bg-blue-200"
                    />
                    <button
                        type="button"
                        onClick={handleImportPDF}
                        disabled={loading || !file}
                        className="bg-blue-700 text-white px-6 py-2 rounded-full font-medium shadow-sm hover:bg-blue-800 disabled:opacity-50"
                    >
                        {loading ? 'Processando...' : 'Extrair Dados'}
                    </button>
                </div>
            </div>

            {warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex items-start gap-3">
                    <AlertCircle className="text-yellow-600 shrink-0 mt-0.5" size={20} />
                    <div>
                        <h4 className="font-semibold text-yellow-800">Atenção na revisão</h4>
                        <ul className="list-disc list-inside text-sm text-yellow-700 mt-1">
                            {warnings.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                    </div>
                </div>
            )}

            <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                <h3 className="font-semibold text-xl border-b pb-2">Detalhes</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Nº do Pedido</label>
                        <input
                            required
                            value={form.numero_pedido}
                            onChange={e => setForm({ ...form, numero_pedido: e.target.value })}
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Data / Hora</label>
                        <input
                            required
                            value={form.data_pedido}
                            onChange={e => setForm({ ...form, data_pedido: e.target.value })}
                            className="w-full border rounded-lg p-2.5 bg-yellow-50 focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Cliente</label>
                        <input
                            required
                            value={form.nome_cliente}
                            onChange={e => setForm({ ...form, nome_cliente: e.target.value })}
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Telefone</label>
                        <input
                            value={form.telefone_cliente}
                            onChange={e => setForm({ ...form, telefone_cliente: e.target.value })}
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                    </div>
                </div>

                <h3 className="font-semibold text-xl border-b pb-2 pt-4">Endereço</h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="sm:col-span-2">
                        <label className="block text-gray-700 font-medium mb-1">Logradouro</label>
                        <input
                            required
                            value={form.logradouro}
                            onChange={e => setForm({ ...form, logradouro: e.target.value })}
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Número</label>
                        <input
                            required
                            value={form.numero_end}
                            onChange={e => setForm({ ...form, numero_end: e.target.value })}
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                    </div>
                    <div className="sm:col-span-3">
                        <label className="block text-gray-700 font-medium mb-1">Bairro</label>
                        <input
                            required
                            value={form.bairro}
                            onChange={e => setForm({ ...form, bairro: e.target.value })}
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                    </div>
                </div>

                <h3 className="font-semibold text-xl border-b pb-2 pt-4">Itens do Pedido</h3>
                <div className="overflow-x-auto border rounded-xl">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3">#</th>
                                <th className="px-4 py-3">Descrição</th>
                                <th className="px-4 py-3">Qtd</th>
                                <th className="px-4 py-3">Un</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {form.itens.length > 0 ? (
                                form.itens.map((item, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium">{item.idx || i + 1}</td>
                                        <td className="px-4 py-3">{item.descricao}</td>
                                        <td className="px-4 py-3">{item.quantidade}</td>
                                        <td className="px-4 py-3">{item.unidade}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500 italic">
                                        Nenhum item importado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <h3 className="font-semibold text-xl border-b pb-2 pt-4">Financeiro</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Total Líquido</label>
                        <input
                            value={form.total_liquido}
                            onChange={e => setForm({ ...form, total_liquido: e.target.value })}
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Forma de Pagamento</label>
                        <input
                            value={form.forma_pagamento}
                            onChange={e => setForm({ ...form, forma_pagamento: e.target.value })}
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                    </div>
                </div>

                <div className="pt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => router.push('/pedidos')}
                        className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-800 disabled:opacity-50"
                    >
                        <Save size={18} />
                        {loading ? 'Salvando...' : 'Salvar Pedido'}
                    </button>
                </div>
            </form>
        </div>
    );
}
