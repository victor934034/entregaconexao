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

class LoginViewModel(application: Application) : AndroidViewModel(application) {
    private val apiService = RetrofitClient.create(application)

    private val _loginResult = MutableLiveData<Result<LoginResponse>>()
    val loginResult: LiveData<Result<LoginResponse>> = _loginResult

    fun login(email: String, senha: String) {
        viewModelScope.launch {
            try {
                val response = apiService.login(mapOf("email" to email, "senha" to senha))
                if (response.isSuccessful && response.body() != null) {
                    val body = response.body()!!
                    
                    if(body.usuario.perfil != "ENTREGADOR") {
                        _loginResult.value = Result.failure(Exception("Apenas entregadores acessam este App."))
                        return@launch
                    }

                    // Save token
                    val prefs = getApplication<Application>().getSharedPreferences("conexao_prefs", Context.MODE_PRIVATE)
                    prefs.edit()
                        .putString("token", body.token)
                        .putInt("uid", body.usuario.id)
                        .putString("nome", body.usuario.nome)
                        .apply()
                        
                    _loginResult.value = Result.success(body)
                } else {
                    val errorBody = response.errorBody()?.string()
                    val errorMessage = try {
                        val json = org.json.JSONObject(errorBody)
                        json.optString("error", "E-mail ou senha incorretos")
                    } catch (e: Exception) {
                        "Corpo ${response.code()}: " + (errorBody?.take(150) ?: "Sem corpo")
                    }
                    _loginResult.value = Result.failure(Exception(errorMessage))
                }
            } catch (e: Exception) {
                _loginResult.value = Result.failure(Exception("Erro de conexão: ${e.message}"))
            }
        }
    }
}
