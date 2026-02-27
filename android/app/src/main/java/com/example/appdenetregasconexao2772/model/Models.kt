package com.example.appdenetregasconexao2772.model

data class Usuario(
    val id: Int,
    val nome: String,
    val email: String,
    val perfil: String,
    val ativo: Boolean
)

data class LoginResponse(
    val token: String,
    val usuario: Usuario
)

data class ItemPedido(
    val id: Int,
    val codigo: String?,
    val descricao: String,
    val quantidade: Double,
    val unidade: String?
)

data class HistoricoStatus(
    val id: Int,
    val status_de: String?,
    val status_para: String?,
    val observacao: String?,
    val data_alteracao: String?,
    val autor: UsuarioSummary?
)

data class UsuarioSummary(
    val nome: String
)

data class Pedido(
    val id: Int,
    val numero_pedido: String?,
    val nome_cliente: String?,
    val logradouro: String?,
    val numero_end: String?,
    val bairro: String?,
    val status: String?,
    val total_liquido: Double?,
    val telefone_cliente: String? = null,
    val celular_cliente: String? = null,
    val data_pedido: String? = null,
    val data_entrega_programada: String? = null,
    val hora_entrega_programada: String? = null,
    val observacao_endereco: String? = null,
    val total_itens: Double? = null,
    val itens: List<ItemPedido>? = null,
    val historicos: List<HistoricoStatus>? = null
)

data class UpdateStatusRequest(
    val status: String,
    val observacao: String? = null
)

data class StatsResponse(
    val total_entregas: Int,
    val ganhos: Double
)

data class UpdateProfileRequest(
    val nome: String,
    val email: String,
    val senha: String? = null
)
