'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Clock, MapPin, Phone, User, Package, Calendar, Banknote, Edit2, Trash2, Printer } from 'lucide-react';

export default function DetalhesPedido({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { usuario } = useAuth();
    const [pedido, setPedido] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPedido = async () => {
            try {
                const response = await api.get(`/pedidos/${params.id}`);
                setPedido(response.data);
            } catch (error) {
                console.error(error);
                alert('Erro ao carregar pedido');
            } finally {
                setLoading(false);
            }
        };
        loadPedido();
    }, [params.id]);

    if (loading) return <div className="p-8 text-center text-gray-500">Carregando...</div>;
    if (!pedido) return <div className="p-8 text-center text-red-500">Pedido não encontrado.</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 bg-white rounded-full border border-gray-200 shadow-sm hover:bg-gray-50"
                >
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        Pedido #{pedido.numero_pedido}
                        <span className="px-3 py-1 rounded-full text-sm font-medium border bg-blue-100 text-blue-800 border-blue-200">
                            {pedido.status}
                        </span>
                    </h2>
                    <p className="text-gray-500">Cadastrado em {new Date(pedido.data_pedido).toLocaleString()}</p>
                </div>
                <div className="flex-1"></div>
                <div className="flex gap-2">
                    <button
                        onClick={() => router.push(`/pedidos/${pedido.id}/editar`)}
                        className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-amber-700 transition-colors shadow-sm"
                    >
                        <Edit2 size={18} /> Editar
                    </button>
                    <button
                        onClick={async () => {
                            if (confirm(`Deseja realmente excluir o pedido #${pedido.numero_pedido}?`)) {
                                try {
                                    await api.delete(`/pedidos/${pedido.id}`);
                                    alert('Pedido excluído!');
                                    router.push('/pedidos');
                                } catch (error) {
                                    console.error(error);
                                    alert('Erro ao excluir pedido');
                                }
                            }
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-red-700 transition-colors shadow-sm"
                    >
                        <Trash2 size={18} /> Excluir
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex justify-between items-center border-b pb-3 mb-4">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <User size={18} className="text-blue-600" /> Dados do Cliente
                            </h3>
                            <div className="flex gap-2">
                                {(pedido.telefone_cliente || pedido.celular_cliente) && (
                                    <a
                                        href={`https://api.whatsapp.com/send?phone=+55${(pedido.celular_cliente || pedido.telefone_cliente).replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center gap-1"
                                    >
                                        WhatsApp
                                    </a>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Cadastro / Agendamento</p>
                                <p className="font-medium text-gray-900">{new Date(pedido.data_pedido).toLocaleDateString()}</p>
                                {pedido.data_entrega_programada && (
                                    <p className="text-blue-700 font-bold mt-1">
                                        Entrega: {new Date(pedido.data_entrega_programada + 'T12:00:00').toLocaleDateString()}
                                        {pedido.hora_entrega_programada && ` às ${pedido.hora_entrega_programada}`}
                                    </p>
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Telefone / Celular</p>
                                <a href={`tel:${pedido.telefone_cliente || pedido.celular_cliente}`} className="font-medium text-blue-600 hover:underline">
                                    {pedido.telefone_cliente || pedido.celular_cliente || 'N/A'}
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex justify-between items-center border-b pb-3 mb-4">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <MapPin size={18} className="text-blue-600" /> Endereço de Entrega
                            </h3>
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${pedido.logradouro}, ${pedido.numero_end} - ${pedido.bairro}, ${pedido.cidade}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                                Abrir no Mapa
                            </a>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 text-lg">
                                {pedido.logradouro}, {pedido.numero_end}
                            </p>
                            <p className="text-gray-600">
                                {pedido.bairro}, {pedido.cidade} - {pedido.estado} {pedido.cep ? `(CEP: ${pedido.cep})` : ''}
                            </p>

                            {pedido.complemento && (
                                <p className="text-sm text-gray-500 mt-1">Complem.: {pedido.complemento}</p>
                            )}
                            {pedido.observacao_endereco && (
                                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                    <p className="text-xs font-bold text-orange-800 uppercase mb-1">Ponto de Referência / Aviso</p>
                                    <p className="text-orange-900 text-sm">{pedido.observacao_endereco}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-semibold text-lg border-b pb-3 mb-4 flex items-center gap-2">
                            <Archive size={18} className="text-blue-600" /> Itens do Pedido
                        </h3>

                        {pedido.itens && pedido.itens.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="text-gray-500 border-b">
                                        <tr>
                                            <th className="pb-2 font-medium">Cód.</th>
                                            <th className="pb-2 font-medium">Descrição</th>
                                            <th className="pb-2 font-medium text-right">Qtd</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pedido.itens.map((item: any) => (
                                            <tr key={item.id} className="border-b border-gray-50 last:border-0">
                                                <td className="py-2 text-gray-500">{item.codigo || '-'}</td>
                                                <td className="py-2 font-medium text-gray-800">{item.descricao}</td>
                                                <td className="py-2 text-right">{item.quantidade} {item.unidade}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm italic">Nenhum item cadastrado separadamente neste pedido.</p>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                        <h3 className="font-semibold text-lg text-blue-900 border-b border-blue-200 pb-3 mb-4">
                            Controle
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-blue-700">Entregador Atribuído</p>
                                <p className="font-medium text-blue-900 text-lg">
                                    {pedido.entregador ? pedido.entregador.nome : 'Nenhum'}
                                </p>
                            </div>

                            {pedido.arquivo_pdf_path && (
                                <a
                                    href={`http://localhost:3000/uploads/pdfs/${pedido.arquivo_pdf_path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full bg-white border border-blue-300 text-blue-700 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-100 font-medium transition-colors"
                                >
                                    <FileText size={18} />
                                    Ver PDF Original
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-semibold text-lg border-b border-gray-200 pb-3 mb-4 flex items-center gap-2">
                            <Clock size={18} className="text-blue-600" /> Histórico
                        </h3>
                        <div className="space-y-4">
                            {pedido.historicos && pedido.historicos.length > 0 ? (
                                pedido.historicos.map((hist: any) => (
                                    <div key={hist.id} className="relative pl-4 border-l-2 border-blue-200 pb-4 last:pb-0 last:border-0">
                                        <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1"></div>
                                        <p className="text-sm font-medium text-gray-900">{hist.status_para}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(hist.data_alteracao || hist.alterado_em || Date.now()).toLocaleString()} por {hist.autor?.nome || 'Sistema'}
                                        </p>
                                        {hist.observacao && <p className="text-xs text-gray-600 mt-1 italic">"{hist.observacao}"</p>}
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500">Nenhum histórico disponível.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-semibold text-lg border-b border-gray-200 pb-3 mb-4 flex items-center gap-2">
                            Atualizar Status (Admin)
                        </h3>
                        <div className="space-y-3">
                            <select
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                value={pedido.status}
                                onChange={async (e) => {
                                    const novoStatus = e.target.value;
                                    if (confirm(`Deseja alterar o status para ${novoStatus}?`)) {
                                        try {
                                            await api.put(`/pedidos/${pedido.id}/status`, { status: novoStatus });
                                            alert('Status atualizado!');
                                            window.location.reload();
                                        } catch (err) {
                                            console.error(err);
                                            alert('Erro ao atualizar status');
                                        }
                                    }
                                }}
                            >
                                <option value="PENDENTE">Pendente</option>
                                <option value="EM_ROTA">Em Rota</option>
                                <option value="ENTREGUE">Entregue</option>
                                <option value="CANCELADO">Cancelado</option>
                            </select>
                            <p className="text-xs text-gray-500 italic">Alterações manuais refletem instantaneamente no app dos entregadores.</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

