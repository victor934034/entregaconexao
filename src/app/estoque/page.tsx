'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Edit2, Trash2, Search, Package, Save, X, FileDown, FileUp, Check, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import api from '@/lib/api';

interface EstoqueItem {
    id: number;
    nome: string;
    quantidade: number;
    modo_estocagem: string;
    custo: number;
    preco_venda: number;
    foto_url: string;
}

export default function EstoquePage() {
    const { token } = useAuth();
    const [itens, setItens] = useState<EstoqueItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importedItems, setImportedItems] = useState<Partial<EstoqueItem>[]>([]);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [formData, setFormData] = useState({
        id: null as number | null,
        nome: '',
        quantidade: '',
        modo_estocagem: '',
        custo: '',
        preco_venda: '',
    });
    const [fotoFile, setFotoFile] = useState<File | null>(null);

    useEffect(() => {
        carregarEstoque();
    }, []);

    const carregarEstoque = async () => {
        try {
            const res = await api.get('/estoque');
            setItens(res.data);
        } catch (error) {
            console.error('Erro ao buscar estoque:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImportPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        const formData = new FormData();
        formData.append('pdf', file);

        try {
            const res = await api.post('/estoque/importar-pdf', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setImportedItems(res.data);
            setImportModalOpen(true);
        } catch (error) {
            console.error('Erro ao importar PDF:', error);
            alert('Erro ao processar o PDF do estoque.');
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const confirmImport = async () => {
        if (!importedItems.length) return;
        setImporting(true);
        try {
            await api.post('/estoque/batch', importedItems);
            setImportModalOpen(false);
            carregarEstoque();
            alert(`${importedItems.length} itens importados com sucesso!`);
        } catch (error) {
            console.error('Erro ao salvar itens importados:', error);
            alert('Erro ao salvar itens importados.');
        } finally {
            setImporting(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const payload = new FormData();
            payload.append('nome', formData.nome);
            payload.append('quantidade', formData.quantidade);
            payload.append('modo_estocagem', formData.modo_estocagem);
            payload.append('custo', formData.custo);
            payload.append('preco_venda', formData.preco_venda);

            if (fotoFile) {
                payload.append('foto', fotoFile);
            }

            if (formData.id) {
                await api.put(`/estoque/${formData.id}`, payload);
            } else {
                await api.post('/estoque', payload);
            }

            setModalOpen(false);
            carregarEstoque();
            resetForm();
        } catch (error) {
            console.error('Erro ao salvar item:', error);
            alert('Erro ao salvar item.');
        }
    };

    const excluirItem = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este item?')) return;

        try {
            await api.delete(`/estoque/${id}`);
            carregarEstoque();
        } catch (error) {
            console.error('Erro ao excluir item:', error);
        }
    };

    const editItem = (item: EstoqueItem) => {
        setFormData({
            id: item.id,
            nome: item.nome,
            quantidade: item.quantidade.toString(),
            modo_estocagem: item.modo_estocagem || '',
            custo: item.custo?.toString() || '',
            preco_venda: item.preco_venda?.toString() || '',
        });
        setFotoFile(null);
        setModalOpen(true);
    };

    const resetForm = () => {
        setFormData({ id: null, nome: '', quantidade: '', modo_estocagem: '', custo: '', preco_venda: '' });
        setFotoFile(null);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    };

    const itensFiltrados = itens.filter(i => i.nome.toLowerCase().includes(busca.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Estoque</h1>
                    <p className="text-gray-500">Gerencie os produtos e inventário do sistema</p>
                </div>
                <div className="flex gap-3">
                    <input
                        type="file"
                        accept="application/pdf"
                        ref={fileInputRef}
                        onChange={handleImportPdf}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importing}
                        className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
                    >
                        <FileUp size={18} /> {importing ? 'Processando...' : 'Importar PDF'}
                    </button>
                    <button
                        onClick={async () => {
                            if (!confirm('Deseja exportar o relatório de estoque em PDF?')) return;
                            try {
                                const response = await api.get('/estoque/exportar/pdf', {
                                    responseType: 'blob'
                                });

                                const blob = new Blob([response.data], { type: 'application/pdf' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `estoque_${new Date().toISOString().split('T')[0]}.pdf`;
                                document.body.appendChild(a);
                                a.click();
                                a.remove();
                                window.URL.revokeObjectURL(url);
                            } catch (error) {
                                console.error('Erro ao exportar PDF:', error);
                                alert('Erro ao exportar PDF do estoque.');
                            }
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <FileDown size={18} /> Exportar PDF
                    </button>
                    <button
                        onClick={() => { resetForm(); setModalOpen(true); }}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                    >
                        <Plus size={20} />
                        Novo Produto
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar produto por nome..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Foto</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Produto</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantidade</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estocagem</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Valores</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Carregando estoque...</td>
                                </tr>
                            ) : itensFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Nenhum produto cadastrado.</td>
                                </tr>
                            ) : (
                                itensFiltrados.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {item.foto_url ? (
                                                <img src={item.foto_url} alt={item.nome} className="w-12 h-12 rounded object-cover border" />
                                            ) : (
                                                <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                                                    <Package size={20} />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.nome}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.quantidade > 5 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {item.quantidade} {item.modo_estocagem || 'un'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{item.modo_estocagem || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="text-gray-900">Venda: {formatCurrency(item.preco_venda)}</div>
                                            <div className="text-gray-500">Custo: {formatCurrency(item.custo)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                            <button
                                                onClick={() => editItem(item)}
                                                className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg"
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => excluirItem(item.id)}
                                                className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded-lg"
                                                title="Excluir"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Importação */}
            {importModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b bg-blue-50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Visualizar Importação</h2>
                                <p className="text-sm text-gray-500">Foram encontrados {importedItems.length} itens no PDF</p>
                            </div>
                            <button onClick={() => setImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            <table className="w-full">
                                <thead className="text-left text-sm font-semibold text-gray-700 border-b">
                                    <tr>
                                        <th className="pb-3">Item</th>
                                        <th className="pb-3 text-center">Qtd</th>
                                        <th className="pb-3">Custo</th>
                                        <th className="pb-3">Venda</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {importedItems.map((item, idx) => (
                                        <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                                            <td className="py-3 text-sm font-medium">{item.nome}</td>
                                            <td className="py-3 text-center text-sm">{item.quantidade} {item.modo_estocagem}</td>
                                            <td className="py-3 text-sm">{formatCurrency(item.custo || 0)}</td>
                                            <td className="py-3 text-sm">{formatCurrency(item.preco_venda || 0)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {importedItems.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <AlertCircle className="mx-auto mb-2 text-yellow-500" size={32} />
                                    Nenhum item válido pôde ser extraído deste PDF. Verifique o formato do arquivo.
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setImportModalOpen(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmImport}
                                disabled={importing || importedItems.length === 0}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                <Check size={20} />
                                {importing ? 'Importando...' : 'Confirmar Importação'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Cadastro */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-900">
                                {formData.id ? 'Editar Produto' : 'Novo Produto'}
                            </h2>
                            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nome}
                                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade *</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={formData.quantidade}
                                        onChange={e => setFormData({ ...formData, quantidade: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Modo de Estocagem</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Prateleira A, Freezer"
                                        value={formData.modo_estocagem}
                                        onChange={e => setFormData({ ...formData, modo_estocagem: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Custo (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.custo}
                                        onChange={e => setFormData({ ...formData, custo: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Preço Venda (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.preco_venda}
                                        onChange={e => setFormData({ ...formData, preco_venda: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Foto do Produto</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => setFotoFile(e.target.files?.[0] || null)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                />
                                <p className="text-xs text-gray-500 mt-1">Selecione uma imagem do seu computador. Ela será enviada diretamente.</p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    <Save size={20} />
                                    Salvar Produto
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
