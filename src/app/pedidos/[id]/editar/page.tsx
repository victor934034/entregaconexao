'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Save, ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';

interface ItemPedido {
    id?: number;
    idx?: number;
    descricao: string;
    quantidade: number;
    unidade: string;
}

interface FormState {
    numero_pedido: string;
    data_emissao: string;
    hora_emissao: string;
    nome_cliente: string;
    telefone_cliente: string;
    estado: string;
    cidade: string;
    bairro: string;
    logradouro: string;
    numero_end: string;
    observacao_endereco: string;
    data_entrega_programada: string;
    hora_entrega_programada: string;
    total_liquido: string;
    forma_pagamento: string;
    itens: ItemPedido[];
}

export default function EditarPedido({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState<FormState>({
        numero_pedido: '',
        data_emissao: '',
        hora_emissao: '',
        nome_cliente: '',
        telefone_cliente: '',
        estado: '',
        cidade: '',
        bairro: '',
        logradouro: '',
        numero_end: '',
        observacao_endereco: '',
        data_entrega_programada: '',
        hora_entrega_programada: '',
        total_liquido: '',
        forma_pagamento: '',
        itens: [],
    });

    useEffect(() => {
        const loadPedido = async () => {
            try {
                const response = await api.get(`/pedidos/${params.id}`);
                const p = response.data;

                // Formatar data_pedido (ISO) para data_emissao (YYYY-MM-DD) e hora_emissao
                const dataObj = new Date(p.data_pedido);
                const dataEmissao = dataObj.toISOString().split('T')[0];
                const horaEmissao = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                setForm({
                    numero_pedido: p.numero_pedido || '',
                    data_emissao: dataEmissao,
                    hora_emissao: horaEmissao,
                    nome_cliente: p.nome_cliente || '',
                    telefone_cliente: p.telefone_cliente || p.celular_cliente || '',
                    estado: p.estado || 'PR',
                    cidade: p.cidade || 'Curitiba',
                    bairro: p.bairro || '',
                    logradouro: p.logradouro || '',
                    numero_end: p.numero_end || '',
                    observacao_endereco: p.observacao_endereco || '',
                    data_entrega_programada: p.data_entrega_programada || '',
                    hora_entrega_programada: p.hora_entrega_programada || '',
                    total_liquido: p.total_liquido ? p.total_liquido.toString().replace('.', ',') : '',
                    forma_pagamento: p.forma_pagamento || '',
                    itens: p.itens || [],
                });
            } catch (error) {
                console.error(error);
                alert('Erro ao carregar pedido.');
                router.push('/pedidos');
            } finally {
                setLoading(false);
            }
        };
        loadPedido();
    }, [params.id]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const formNormalizado: any = { ...form };

            if (typeof formNormalizado.total_liquido === 'string') {
                formNormalizado.total_liquido = formNormalizado.total_liquido.replace(',', '.').replace(/[^\d.]/g, '');
            }

            // Normalizar data_emissao para data_pedido (ISO)
            if (form.data_emissao) {
                formNormalizado.data_pedido = `${form.data_emissao}T${form.hora_emissao || '00:00'}:00.000Z`;
            }

            // Calcular total_itens
            formNormalizado.total_itens = form.itens.reduce((acc, item) => acc + (item.quantidade || 0), 0);

            delete formNormalizado.data_emissao;
            delete formNormalizado.hora_emissao;

            if (formNormalizado.data_entrega_programada === '') formNormalizado.data_entrega_programada = null;
            if (formNormalizado.hora_entrega_programada === '') formNormalizado.hora_entrega_programada = null;

            // Strip internal IDs from items
            formNormalizado.itens = form.itens.map(({ id, idx, ...rest }: any) => rest);

            await api.put(`/pedidos/${params.id}`, formNormalizado);
            alert('Pedido atualizado com sucesso!');
            router.push('/pedidos');
        } catch (error) {
            console.error(error);
            alert('Erro ao atualizar pedido.');
        } finally {
            setSaving(false);
        }
    };

    const updateItem = (index: number, field: keyof ItemPedido, value: any) => {
        const newItens = [...form.itens];
        newItens[index] = { ...newItens[index], [field]: value };
        setForm({ ...form, itens: newItens });
    };

    const addItem = () => {
        setForm({
            ...form,
            itens: [...form.itens, { descricao: '', quantidade: 1, unidade: 'UN' }]
        });
    };

    const removeItem = (index: number) => {
        const newItens = form.itens.filter((_, i) => i !== index);
        setForm({ ...form, itens: newItens });
    };

    if (loading) return <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-2">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        Carregando dados do pedido...
    </div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 bg-white rounded-full border border-gray-200 shadow-sm hover:bg-gray-50"
                >
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Editar Pedido #{form.numero_pedido}</h2>
                    <p className="text-gray-500">Altere as informações necessárias abaixo.</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                <h3 className="font-semibold text-xl border-b pb-2">Detalhes Principais</h3>

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
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-gray-700 font-medium mb-1">Data Emissão</label>
                            <input
                                type="date"
                                required
                                value={form.data_emissao}
                                onChange={e => setForm({ ...form, data_emissao: e.target.value })}
                                className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-medium mb-1">Hora Emissão</label>
                            <input
                                type="time"
                                required
                                value={form.hora_emissao}
                                onChange={e => setForm({ ...form, hora_emissao: e.target.value })}
                                className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 outline-none"
                            />
                        </div>
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
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-gray-700 font-medium mb-1 text-blue-700">Data Programada</label>
                            <input
                                type="date"
                                value={form.data_entrega_programada}
                                onChange={e => setForm({ ...form, data_entrega_programada: e.target.value })}
                                className="w-full border border-blue-200 bg-blue-50 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-medium mb-1 text-blue-700">Hora Programada</label>
                            <input
                                type="time"
                                value={form.hora_entrega_programada}
                                onChange={e => setForm({ ...form, hora_entrega_programada: e.target.value })}
                                className="w-full border border-blue-200 bg-blue-50 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 outline-none"
                            />
                        </div>
                    </div>
                </div>

                <h3 className="font-semibold text-xl border-b pb-2 pt-4">Endereço de Entrega</h3>

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
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Bairro</label>
                        <input
                            required
                            value={form.bairro}
                            onChange={e => setForm({ ...form, bairro: e.target.value })}
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Cidade</label>
                        <input
                            required
                            value={form.cidade}
                            onChange={e => setForm({ ...form, cidade: e.target.value })}
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Estado</label>
                        <input
                            required
                            value={form.estado}
                            onChange={e => setForm({ ...form, estado: e.target.value })}
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                    </div>
                    <div className="sm:col-span-3">
                        <label className="block text-gray-700 font-medium mb-1 text-orange-700 font-bold">Observações / Ponto de Referência</label>
                        <textarea
                            value={form.observacao_endereco}
                            onChange={e => setForm({ ...form, observacao_endereco: e.target.value })}
                            className="w-full border border-orange-200 bg-orange-50 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-600 outline-none h-20"
                        />
                    </div>
                </div>

                <div className="flex justify-between items-center border-b pb-2 pt-4">
                    <h3 className="font-semibold text-xl">Itens do Pedido</h3>
                    <button
                        type="button"
                        onClick={addItem}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                    >
                        <Plus size={16} /> Adicionar Item
                    </button>
                </div>

                <div className="overflow-x-auto border rounded-xl">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3">Descrição</th>
                                <th className="px-4 py-3 w-32">Qtd</th>
                                <th className="px-4 py-3 w-24">Un</th>
                                <th className="px-4 py-3 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {form.itens.map((item, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <input
                                            value={item.descricao}
                                            onChange={e => updateItem(i, 'descricao', e.target.value)}
                                            className="w-full border border-gray-200 focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 outline-none"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            step="0.001"
                                            value={item.quantidade}
                                            onChange={e => updateItem(i, 'quantidade', parseFloat(e.target.value) || 0)}
                                            className="w-full border border-gray-200 focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 outline-none"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            value={item.unidade}
                                            onChange={e => updateItem(i, 'unidade', e.target.value)}
                                            className="w-full border border-gray-200 focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 outline-none"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            type="button"
                                            onClick={() => removeItem(i)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {form.itens.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500 italic">
                                        Nenhum item cadastrado. Clique em "Adicionar Item".
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
                        disabled={saving}
                        className="bg-blue-700 text-white px-8 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-800 disabled:opacity-50 shadow-md"
                    >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </form>
        </div>
    );
}
