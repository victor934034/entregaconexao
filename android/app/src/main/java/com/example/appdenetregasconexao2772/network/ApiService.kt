package com.example.appdenetregasconexao2772.network

import com.example.appdenetregasconexao2772.model.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    @POST("auth/login")
    suspend fun login(@Body request: Map<String, String>): Response<LoginResponse>

    @POST("auth/registrar")
    suspend fun registrar(@Body request: Map<String, String>): Response<LoginResponse>

    @GET("pedidos")
    suspend fun getPedidos(@Query("status") status: String? = null): Response<List<Pedido>>

    @GET("pedidos/entregador/{uid}")
    suspend fun getPedidosEntregador(
        @Path("uid") uid: Int,
        @Query("dataInicio") dataInicio: String? = null,
        @Query("dataFim") dataFim: String? = null
    ): Response<List<Pedido>>

    @GET("pedidos/{id}")
    suspend fun getPedidoDetalhes(@Path("id") id: Int): Response<Pedido>

    @PATCH("pedidos/{id}/status")
    suspend fun updateStatus(@Path("id") id: Int, @Body request: UpdateStatusRequest): Response<Pedido>

    @GET("usuarios/{uid}/stats")
    suspend fun getUserStats(@Path("uid") uid: Int): Response<StatsResponse>

    @PUT("usuarios/{id}")
    suspend fun updateProfile(@Path("id") id: Int, @Body request: UpdateProfileRequest): Response<Map<String, Any>>
}
