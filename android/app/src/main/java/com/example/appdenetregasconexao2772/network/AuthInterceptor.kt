package com.example.appdenetregasconexao2772.network

import android.content.Context
import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor(private val context: Context) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val prefs = context.getSharedPreferences("conexao_prefs", Context.MODE_PRIVATE)
        val token = prefs.getString("token", null)
        
        android.util.Log.d("AuthInterceptor", "Token encontrado: ${if (token.isNullOrEmpty()) "NULO/VAZIO" else token.take(10) + "..."}")

        val requestBuilder = chain.request().newBuilder()
        if (!token.isNullOrEmpty()) {
            requestBuilder.addHeader("Authorization", "Bearer $token")
        } else {
            android.util.Log.e("AuthInterceptor", "ERRO: Token não encontrado ou vazio no SharedPreferences!")
        }

        return chain.proceed(requestBuilder.build())
    }
}
