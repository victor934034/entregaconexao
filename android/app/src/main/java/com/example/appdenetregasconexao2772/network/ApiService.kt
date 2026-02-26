package com.example.appdenetregasconexao2772.network

import com.example.appdenetregasconexao2772.model.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    @POST("api/auth/login")
    suspend fun login(@Body request: Map<String, String>): Response<LoginResponse>

    @GET("api/pedidos")
    suspend fun getPedidos(@Query("status") status: String? = null): Response<List<Pedido>>

    @GET("api/pedidos/entregador/{uid}")
    suspend fun getPedidosEntregador(@Path("uid") uid: Int): Response<List<Pedido>>

    @GET("api/pedidos/{id}")
    suspend fun getPedidoDetalhes(@Path("id") id: Int): Response<Pedido>

    @PATCH("api/pedidos/{id}/status")
    suspend fun updateStatus(@Path("id") id: Int, @Body request: UpdateStatusRequest): Response<Pedido>
}
