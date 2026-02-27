package com.example.appdenetregasconexao2772.ui.login

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.example.appdenetregasconexao2772.model.LoginResponse
import com.example.appdenetregasconexao2772.network.RetrofitClient
import kotlinx.coroutines.launch

class RegisterViewModel(application: Application) : AndroidViewModel(application) {
    private val apiService = RetrofitClient.create(application)

    private val _registerResult = MutableLiveData<Result<LoginResponse>>()
    val registerResult: LiveData<Result<LoginResponse>> = _registerResult

    fun registrar(nome: String, email: String, senha: String) {
        viewModelScope.launch {
            try {
                val response = apiService.registrar(mapOf(
                    "nome" to nome,
                    "email" to email,
                    "senha" to senha
                ))
                if (response.isSuccessful && response.body() != null) {
                    val body = response.body()!!
                    
                    // Save token
                    val prefs = getApplication<Application>().getSharedPreferences("conexao_prefs", Context.MODE_PRIVATE)
                    prefs.edit()
                        .putString("token", body.token)
                        .putInt("uid", body.usuario.id)
                        .putString("nome", body.usuario.nome)
                        .apply()
                        
                    _registerResult.value = Result.success(body)
                } else {
                    val errorBody = response.errorBody()?.string()
                    val errorMessage = try {
                        val json = org.json.JSONObject(errorBody)
                        json.optString("error", "Erro desconhecido")
                    } catch (e: Exception) {
                        "Corpo 404: " + (errorBody?.take(150) ?: "Sem corpo")
                    }
                    _registerResult.value = Result.failure(Exception(errorMessage))
                }
            } catch (e: Exception) {
                _registerResult.value = Result.failure(Exception("Erro de conexão: ${e.message}"))
            }
        }
    }
}
