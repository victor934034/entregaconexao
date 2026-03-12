'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Upload, Save, AlertCircle, FileText, Layers, ChevronRight, Plus, Trash } from 'lucide-react';

interface ItemPedido {
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
    endereco: string;
    numero_end: string;
    observacao_endereco: string;
    email_cliente: string;
    data_entrega_programada: string;
    hora_entrega_programada: string;
    total_liquido: string;
    forma_pagamento: string;
    itens: ItemPedido[];
}

export default function NovoPedido() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [importMode, setImportMode] = useState<'single' | 'multi' | null>(null);

    const [form, setForm] = useState<FormState>({
        numero_pedido: '',
        data_emissao: new Date().toISOString().split('T')[0],
        hora_emissao: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        nome_cliente: '',
        telefone_cliente: '',
        estado: 'PR',
        cidade: 'Curitiba',
        bairro: '',
        endereco: '',
        numero_end: '',
        observacao_endereco: '',
        email_cliente: '',
        data_entrega_programada: '',
        hora_entrega_programada: '',
        total_liquido: '',
        forma_pagamento: '',
        itens: [],
    });

    const [warnings, setWarnings] = useState<string[]>([]);
    const [multiOrders, setMultiOrders] = useState<FormState[]>([]);
    const [currentMultiIndex, setCurrentMultiIndex] = useState<number | null>(null);

    const addItem = () => {
        const newItem: ItemPedido = { descricao: '', quantidade: 1, unidade: 'un' };
        if (currentMultiIndex !== null) {
            const newMulti = [...multiOrders];
            newMulti[currentMultiIndex].itens = [...newMulti[currentMultiIndex].itens, newItem];
            setMultiOrders(newMulti);
        } else {
            setForm(prev => ({ ...prev, itens: [...prev.itens, newItem] }));
        }
    };

    const removeItem = (index: number) => {
        if (currentMultiIndex !== null) {
            const newMulti = [...multiOrders];
            newMulti[currentMultiIndex].itens = newMulti[currentMultiIndex].itens.filter((_, i) => i !== index);
            setMultiOrders(newMulti);
        } else {
            setForm(prev => ({ ...prev, itens: prev.itens.filter((_, i) => i !== index) }));
        }
    };

    const updateItem = (index: number, field: keyof ItemPedido, value: any) => {
        if (currentMultiIndex !== null) {
            const newMulti = [...multiOrders];
            const newItens = [...newMulti[currentMultiIndex].itens];
            newItens[index] = { ...newItens[index], [field]: value };
            newMulti[currentMultiIndex] = { ...newMulti[currentMultiIndex], itens: newItens };
            setMultiOrders(newMulti);
        } else {
            const newItens = [...form.itens];
            newItens[index] = { ...newItens[index], [field]: value };
            setForm({ ...form, itens: newItens });
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const formatDateForInput = (dateStr: string) => {
        if (!dateStr) return '';
        // Converte DD/MM/YYYY para YYYY-MM-DD
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                return `${year}-${month}-${day}`;
            }
        }
        return dateStr;
    };

    const handleImportPDF = async () => {
        if (!file) return alert('Selecione um arquivo PDF.');

        setLoading(true);
        setWarnings([]);
        setMultiOrders([]);
        setCurrentMultiIndex(null);

        const formData = new FormData();
        formData.append('pdf', file);

        try {
            const response = await api.post('/pedidos/importar-pdf', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            const data = response.data;

            if (data.isMulti) {
                const mappedOrders = data.pedidos.map((p: any) => ({
                    numero_pedido: p.numeroPedido.value,
                    data_emissao: formatDateForInput(p.dataPedido.value) || new Date().toISOString().split('T')[0],
                    hora_emissao: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                    nome_cliente: p.nomeCliente.value,
                    telefone_cliente: p.telefoneCliente.value,
                    estado: 'PR',
                    cidade: 'Curitiba',
                    bairro: p.endereco?.bairro || '',
                    endereco: p.endereco?.endereco || '',
                    numero_end: p.endereco?.numero || '',
                    observacao_endereco: p.endereco?.observacao || '',
                    email_cliente: p.emailCliente?.value || '',
                    data_entrega_programada: '',
                    hora_entrega_programada: '',
                    total_liquido: p.totalLiquido.value,
                    forma_pagamento: p.formaPagamento.value,
                    itens: p.itens || [],
                }));
                setMultiOrders(mappedOrders);
                setCurrentMultiIndex(0);
                // No need for alert if we have the new UI indicator
            } else {
                const newWarnings: string[] = [];

                const verifyTrust = (field: any, name: string) => {
                    if (field?.confianca === 'baixa') {
                        newWarnings.push(`Por favor verifique o campo: ${name}`);
                    }
                    return field?.value || '';
                };

                const dataImportada = verifyTrust(data.dataPedido, 'Data do Pedido');
                let dataSplit = dataImportada.split(' ');

                const dataExtraida = formatDateForInput(dataSplit[0]);
                const horaExtraida = dataSplit[1] || '';

                setForm({
                    ...form,
                    numero_pedido: verifyTrust(data.numeroPedido, 'Número do Pedido'),
                    data_emissao: dataExtraida || new Date().toISOString().split('T')[0],
                    hora_emissao: horaExtraida || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                    nome_cliente: verifyTrust(data.nomeCliente, 'Nome do Cliente'),
                    telefone_cliente: verifyTrust(data.telefoneCliente, 'Telefone do Cliente'),
                    total_liquido: verifyTrust(data.totalLiquido, 'Total Líquido'),
                    forma_pagamento: verifyTrust(data.formaPagamento, 'Forma de Pagamento'),
                    endereco: data.endereco?.endereco || '',
                    numero_end: data.endereco?.numero || '',
                    bairro: data.endereco?.bairro || '',
                    observacao_endereco: data.endereco?.observacao || '',
                    email_cliente: data.emailCliente?.value || '',
                    data_entrega_programada: formatDateForInput(data.dataEntregaProgramada?.value) || '',
                    hora_entrega_programada: data.horaEntregaProgramada?.value || '',
                    itens: data.itens || [],
                });

                setWarnings(newWarnings);
            }
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
            const ordersToSave = multiOrders.length > 0 ? multiOrders : [form];

            for (const orderData of ordersToSave) {
                const formNormalizado: any = { ...orderData };

                if (typeof formNormalizado.total_liquido === 'string') {
                    formNormalizado.total_liquido = formNormalizado.total_liquido.replace(',', '.').replace(/[^\d.]/g, '');
                }

                // Normalizar data_emissao para data_pedido (ISO)
                if (orderData.data_emissao) {
                    formNormalizado.data_pedido = `${orderData.data_emissao}T${orderData.hora_emissao || '00:00'}:00.000Z`;
                } else {
                    formNormalizado.data_pedido = new Date().toISOString();
                }

                // Calcular total_itens
                formNormalizado.total_itens = orderData.itens.reduce((acc: number, item: any) => acc + (item.quantidade || 0), 0);

                delete formNormalizado.data_emissao;
                delete formNormalizado.hora_emissao;

                if (formNormalizado.data_entrega_programada === '') delete (formNormalizado as any).data_entrega_programada;
                if (formNormalizado.hora_entrega_programada === '') delete (formNormalizado as any).hora_entrega_programada;

                await api.post('/pedidos', formNormalizado);
            }

            alert(multiOrders.length > 0 ? `${multiOrders.length} pedidos criados com sucesso!` : 'Pedido criado com sucesso!');
            router.push('/pedidos');
        } catch (error) {
            console.error(error);
            alert('Erro ao criar pedido.');
        } finally {
            setLoading(false);
        }
    };

    const currentForm = currentMultiIndex !== null ? multiOrders[currentMultiIndex] : form;
    const updateFormField = (field: keyof FormState, value: any) => {
        if (currentMultiIndex !== null) {
            const newMulti = [...multiOrders];
            newMulti[currentMultiIndex] = { ...newMulti[currentMultiIndex], [field]: value };
            setMultiOrders(newMulti);
        } else {
            setForm({ ...form, [field]: value });
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Novo Pedido</h2>
                    <p className="text-gray-500 mt-1 text-lg">Escolha uma forma de entrada para começar.</p>
                </div>
                {multiOrders.length > 0 && (
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 animate-pulse shadow-lg">
                        <Layers size={16} />
                        MODO LOTE ATIVO ({multiOrders.length})
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Opção 1: Pedido Único */}
                <div
                    onClick={() => document.getElementById('file-single')?.click()}
                    className={`relative group cursor-pointer overflow-hidden rounded-2xl border-2 transition-all duration-300 ${importMode === 'single' ? 'border-blue-600 bg-blue-50 shadow-lg scale-[1.02]' : 'border-gray-100 bg-white hover:border-blue-300 hover:shadow-md'
                        }`}
                >
                    <div className="p-6">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors ${importMode === 'single' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
                            }`}>
                            <FileText size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Pedido Único</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Importe um PDF de nota fiscal ou pedido padrão. O sistema preencherá os detalhes automaticamente.
                        </p>
                        <div className="mt-4 flex items-center text-blue-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                            Selecionar Arquivo <ChevronRight size={16} />
                        </div>
                    </div>
                    <input
                        id="file-single"
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={async (e) => {
                            const selectedFile = e.target.files?.[0];
                            if (selectedFile) {
                                setFile(selectedFile);
                                setImportMode('single');
                                // We'll trigger handleImportPDF indirectly or after state update
                                // For better UX, we call it manually here since state update is async
                                await (async () => {
                                    setLoading(true);
                                    setWarnings([]);
                                    setMultiOrders([]);
                                    setCurrentMultiIndex(null);
                                    const formData = new FormData();
                                    formData.append('pdf', selectedFile);
                                    try {
                                        const resp = await api.post('/pedidos/importar-pdf', formData, {
                                            headers: { 'Content-Type': 'multipart/form-data' }
                                        });
                                        const data = resp.data;
                                        if (data.isMulti) {
                                            // Fallback if user clicked single for a multi file
                                            const mapped = data.pedidos.map((p: any) => ({
                                                numero_pedido: p.numeroPedido.value,
                                                data_emissao: formatDateForInput(p.dataPedido.value) || new Date().toISOString().split('T')[0],
                                                hora_emissao: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                                                nome_cliente: p.nomeCliente.value,
                                                telefone_cliente: p.telefoneCliente.value,
                                                estado: 'PR',
                                                cidade: 'Curitiba',
                                                bairro: p.endereco?.bairro || '',
                                                endereco: p.endereco?.endereco || '',
                                                numero_end: p.endereco?.numero || '',
                                                observacao_endereco: p.endereco?.observacao || '',
                                                data_entrega_programada: '',
                                                hora_entrega_programada: '',
                                                total_liquido: p.totalLiquido.value,
                                                forma_pagamento: p.formaPagamento.value,
                                                itens: p.itens || [],
                                            }));
                                            setMultiOrders(mapped);
                                            setCurrentMultiIndex(0);
                                        } else {
                                            const dataPedido = data.dataPedido?.value ? formatDateForInput(data.dataPedido.value) : new Date().toISOString().split('T')[0];
                                            setForm(prev => ({
                                                ...prev,
                                                numero_pedido: data.numeroPedido?.value || '',
                                                data_emissao: dataPedido,
                                                nome_cliente: data.nomeCliente?.value || '',
                                                telefone_cliente: data.telefoneCliente?.value || '',
                                                total_liquido: data.totalLiquido?.value || '',
                                                forma_pagamento: data.formaPagamento?.value || '',
                                                itens: data.itens || []
                                            }));
                                        }
                                    } catch (err) {
                                        alert('Erro ao processar PDF');
                                    } finally {
                                        setLoading(false);
                                    }
                                })();
                            }
                        }}
                    />
                </div>

                {/* Opção 2: Multi Pedidos */}
                <div
                    onClick={() => document.getElementById('file-multi')?.click()}
                    className={`relative group cursor-pointer overflow-hidden rounded-2xl border-2 transition-all duration-300 ${importMode === 'multi' ? 'border-purple-600 bg-purple-50 shadow-lg scale-[1.02]' : 'border-gray-100 bg-white hover:border-purple-300 hover:shadow-md'
                        }`}
                >
                    <div className="p-6">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors ${importMode === 'multi' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-600 group-hover:bg-purple-100'
                            }`}>
                            <Layers size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Lista de Pedidos (Lote)</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Importe o Borderô ou Lista de Entrega. Ideal para cadastrar vários clientes de uma só vez.
                        </p>
                        <div className="mt-4 flex items-center text-purple-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                            Selecionar Lista <ChevronRight size={16} />
                        </div>
                    </div>
                    <input
                        id="file-multi"
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={async (e) => {
                            const selectedFile = e.target.files?.[0];
                            if (selectedFile) {
                                setFile(selectedFile);
                                setImportMode('multi');
                                await (async () => {
                                    setLoading(true);
                                    setWarnings([]);
                                    setMultiOrders([]);
                                    setCurrentMultiIndex(null);
                                    const formData = new FormData();
                                    formData.append('pdf', selectedFile);
                                    try {
                                        const resp = await api.post('/pedidos/importar-pdf', formData, {
                                            headers: { 'Content-Type': 'multipart/form-data' }
                                        });
                                        const data = resp.data;
                                        if (data.isMulti) {
                                            const mapped = data.pedidos.map((p: any) => ({
                                                numero_pedido: p.numeroPedido.value,
                                                data_emissao: formatDateForInput(p.dataPedido.value) || new Date().toISOString().split('T')[0],
                                                hora_emissao: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                                                nome_cliente: p.nomeCliente.value,
                                                telefone_cliente: p.telefoneCliente.value,
                                                estado: 'PR',
                                                cidade: 'Curitiba',
                                                bairro: p.endereco?.bairro || '',
                                                endereco: p.endereco?.endereco || '',
                                                numero_end: p.endereco?.numero || '',
                                                observacao_endereco: p.endereco?.observacao || '',
                                                data_entrega_programada: '',
                                                hora_entrega_programada: '',
                                                total_liquido: p.totalLiquido.value,
                                                forma_pagamento: p.formaPagamento.value,
                                                itens: p.itens || [],
                                            }));
                                            setMultiOrders(mapped);
                                            setCurrentMultiIndex(0);
                                        } else {
                                            alert('Este arquivo não parece ser uma lista de pedidos. Tentando importar como pedido único.');
                                            const dataPedido = data.dataPedido?.value ? formatDateForInput(data.dataPedido.value) : new Date().toISOString().split('T')[0];
                                            setForm(prev => ({
                                                ...prev,
                                                numero_pedido: data.numeroPedido?.value || '',
                                                data_emissao: dataPedido,
                                                nome_cliente: data.nomeCliente?.value || '',
                                                telefone_cliente: data.telefoneCliente?.value || '',
                                                total_liquido: data.totalLiquido?.value || '',
                                                forma_pagamento: data.formaPagamento?.value || '',
                                                itens: data.itens || []
                                            }));
                                        }
                                    } catch (err) {
                                        alert('Erro ao processar PDF');
                                    } finally {
                                        setLoading(false);
                                    }
                                })();
                            }
                        }}
                    />
                </div>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-8 gap-4 text-blue-600 font-semibold bg-white/50 backdrop-blur-sm rounded-2xl border border-blue-100 animate-in fade-in zoom-in duration-300">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    Analisando documentos e extraindo dados...
                </div>
            )}

            {multiOrders.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="font-bold text-blue-900">Modo Lote de Pedidos:</span>
                        <div className="flex gap-1">
                            {multiOrders.map((_item: FormState, idx: number) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setCurrentMultiIndex(idx)}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${currentMultiIndex === idx
                                        ? 'bg-blue-700 text-white'
                                        : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-100'
                                        }`}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="text-sm text-blue-700">
                        Editando pedido {currentMultiIndex !== null ? currentMultiIndex + 1 : 0} de {multiOrders.length}
                    </div>
                </div>
            )}

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
                            value={currentForm.numero_pedido}
                            onChange={e => updateFormField('numero_pedido', e.target.value)}
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-gray-700 font-medium mb-1">Data Emissão</label>
                            <input
                                type="date"
                                required
                                value={currentForm.data_emissao}
                                onChange={e => updateFormField('data_emissao', e.target.value)}
                                className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-medium mb-1">Hora Emissão</label>
                            <input
                                type="time"
                                required
                                value={currentForm.hora_emissao}
                                onChange={e => updateFormField('hora_emissao', e.target.value)}
                                className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Cliente</label>
                        <input
                            required
                            value={currentForm.nome_cliente}
                            onChange={e => updateFormField('nome_cliente', e.target.value)}
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Telefone</label>
                        <input
                            value={currentForm.telefone_cliente}
                            onChange={e => updateFormField('telefone_cliente', e.target.value)}
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">E-mail do Cliente</label>
                        <input
                            type="email"
                            value={currentForm.email_cliente}
                            onChange={(e) => updateFormField('email_cliente', e.target.value)}
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 outline-none"
                            placeholder="exemplo@email.com"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-gray-700 font-medium mb-1 text-blue-700">Data Programada</label>
                            <input
                                type="date"
                                value={currentForm.data_entrega_programada}
                                onChange={e => updateFormField('data_entrega_programada', e.target.value)}
                                className="w-full border border-blue-200 bg-blue-50 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-medium mb-1 text-blue-700">Hora Programada</label>
                            <input
                                type="time"
                                value={currentForm.hora_entrega_programada}
                                onChange={e => updateFormField('hora_entrega_programada', e.target.value)}
                                className="w-full border border-blue-200 bg-blue-50 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 outline-none"
                            />
                        </div>
                    </div>
                </div>

                <h3 className="font-semibold text-xl border-b pb-2 pt-4">Endereço</h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="sm:col-span-2">
                        <label className="block text-gray-700 font-medium mb-1">Endereço</label>
                        <input
                            required
                            value={currentForm.endereco}
                            onChange={e => updateFormField('endereco', e.target.value)}
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 outline-none"
                            placeholder="Ex: Rua das Flores"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Número</label>
                        <input
                            required
                            value={currentForm.numero_end}
                            onChange={e => updateFormField('numero_end', e.target.value)}
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                    </div>
                    <div className="sm:col-span-3">
                        <label className="block text-gray-700 font-medium mb-1">Bairro</label>
                        <input
                            required
                            value={currentForm.bairro}
                            onChange={e => updateFormField('bairro', e.target.value)}
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                    </div>
                    <div className="sm:col-span-3">
                        <label className="block text-gray-700 font-medium mb-1 text-orange-700 font-bold">Avisos / Observação do Endereço (Ponto de Refêrencia)</label>
                        <textarea
                            value={currentForm.observacao_endereco}
                            onChange={e => updateFormField('observacao_endereco', e.target.value)}
                            placeholder="Tipo: Portão verde, Perto da praça, etc."
                            className="w-full border border-orange-200 bg-orange-50 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-600 outline-none h-20"
                        />
                    </div>
                </div>                <div className="flex items-center justify-between border-b pb-2 pt-4">
                    <h3 className="font-semibold text-xl text-gray-800">Itens do Pedido</h3>
                    <button
                        type="button"
                        onClick={addItem}
                        className="flex items-center gap-1 text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors font-semibold shadow-sm"
                    >
                        <Plus size={16} />
                        Adicionar Item
                    </button>
                </div>

                <div className="overflow-x-auto border rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3 w-10 text-center">#</th>
                                <th className="px-4 py-3">Descrição</th>
                                <th className="px-4 py-3 w-24 text-center">Qtd</th>
                                <th className="px-4 py-3 w-20 text-center">Un</th>
                                <th className="px-4 py-3 w-10 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-gray-800">
                            {currentForm.itens.length > 0 ? (
                                currentForm.itens.map((item, i) => (
                                    <tr key={i} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-4 py-3 font-medium text-gray-400 text-center">{item.idx || i + 1}</td>
                                        <td className="px-4 py-3">
                                            <input
                                                value={item.descricao}
                                                onChange={e => updateItem(i, 'descricao', e.target.value)}
                                                placeholder="Descrição do produto"
                                                className="w-full border border-gray-100 focus:border-blue-300 focus:ring-1 focus:ring-blue-100 rounded px-2 py-1.5 outline-none bg-transparent transition-all"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                step="0.001"
                                                value={item.quantidade}
                                                onChange={e => updateItem(i, 'quantidade', parseFloat(e.target.value) || 0)}
                                                className="w-full border border-gray-100 focus:border-blue-300 focus:ring-1 focus:ring-blue-100 rounded px-2 py-1.5 outline-none bg-transparent text-center transition-all"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                value={item.unidade}
                                                onChange={e => updateItem(i, 'unidade', e.target.value)}
                                                className="w-full border border-gray-100 focus:border-blue-300 focus:ring-1 focus:ring-blue-100 rounded px-2 py-1.5 outline-none bg-transparent text-center uppercase transition-all font-mono"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => removeItem(i)}
                                                className="text-gray-300 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-lg group-hover:scale-110 active:scale-95"
                                                title="Remover item"
                                            >
                                                <Trash size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400 italic bg-gray-50/30">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-3 bg-white rounded-full shadow-sm border border-gray-100">
                                                <AlertCircle size={32} className="text-gray-300" />
                                            </div>
                                            <div className="max-w-xs text-sm">
                                                Nenhum item adicionado. Use o botão abaixo para adicionar manualmente ou importe um PDF.
                                            </div>
                                            <button
                                                type="button"
                                                onClick={addItem}
                                                className="mt-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-semibold border border-blue-200 hover:bg-blue-200 transition-colors"
                                            >
                                                Adicionar Item Manualmente
                                            </button>
                                        </div>
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
                            value={currentForm.total_liquido}
                            onChange={e => updateFormField('total_liquido', e.target.value)}
                            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Forma de Pagamento</label>
                        <input
                            value={currentForm.forma_pagamento}
                            onChange={e => updateFormField('forma_pagamento', e.target.value)}
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
                        {loading ? 'Salvando...' : multiOrders.length > 0 ? 'Salvar Todos os Pedidos' : 'Salvar Pedido'}
                    </button>
                </div>
            </form>
        </div>
    );
}
