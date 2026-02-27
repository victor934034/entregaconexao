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

data class Pedido(
    val id: Int,
    val numero_pedido: String?,
    val nome_cliente: String?,
    val logradouro: String?,
    val numero_end: String?,
    val bairro: String?,
    val status: String?,
    val total_liquido: Double?,
    val data_pedido: String? = null,
    val itens: List<ItemPedido>? = null
)

data class UpdateStatusRequest(
    val status: String,
    val observacao: String? = null
)
