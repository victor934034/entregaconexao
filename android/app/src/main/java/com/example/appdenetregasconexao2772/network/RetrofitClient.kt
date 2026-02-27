package com.example.appdenetregasconexao2772.network

import android.content.Context
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitClient {
    private const val BASE_URL = "https://app-backend.zdc13k.easypanel.host/api/"

    fun create(context: Context): ApiService {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.HEADERS // Reduzido de BODY para HEADERS para performance
        }

        val cacheSize = 10 * 1024 * 1024L // 10 MB
        val cache = okhttp3.Cache(context.cacheDir, cacheSize)

        val client = OkHttpClient.Builder()
            .cache(cache) // Adicionado Cache
            .addInterceptor(logging)
            .addInterceptor(AuthInterceptor(context))
            .connectTimeout(15, TimeUnit.SECONDS) // Reduzido de 30 para 15
            .readTimeout(15, TimeUnit.SECONDS)
            .build()

        val retrofit = Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        return retrofit.create(ApiService::class.java)
    }
}
