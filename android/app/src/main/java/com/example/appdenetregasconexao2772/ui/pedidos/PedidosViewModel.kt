package com.example.appdenetregasconexao2772.ui.pedidos

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.example.appdenetregasconexao2772.model.Pedido
import com.example.appdenetregasconexao2772.model.UpdateStatusRequest
import com.example.appdenetregasconexao2772.network.RetrofitClient
import kotlinx.coroutines.launch

class PedidosViewModel(application: Application) : AndroidViewModel(application) {
    private val apiService = RetrofitClient.create(application)

    private val _pedidos = MutableLiveData<List<Pedido>>()
    val pedidos: LiveData<List<Pedido>> = _pedidos
    
    private val _error = MutableLiveData<String>()
    val error: LiveData<String> = _error

    private val _statusUpdateSuccess = MutableLiveData<Boolean>()
    val statusUpdateSuccess: LiveData<Boolean> = _statusUpdateSuccess

    fun carregarPedidosEntregador() {
        val prefs = getApplication<Application>().getSharedPreferences("conexao_prefs", Context.MODE_PRIVATE)
        val uid = prefs.getInt("uid", -1)
        
        if(uid == -1) return

        viewModelScope.launch {
            try {
                val response = apiService.getPedidosEntregador(uid)
                if (response.isSuccessful) {
                    _pedidos.value = response.body() ?: emptyList()
                } else {
                    _error.value = "Falha ao carregar pedidos"
                }
            } catch (e: Exception) {
                _error.value = "Erro de rede: ${e.message}"
            }
        }
    }

    fun atualizarStatus(pedidoId: Int, novoStatus: String, observacao: String = "") {
        viewModelScope.launch {
            try {
                _statusUpdateSuccess.value = false
                val req = UpdateStatusRequest(status = novoStatus, observacao = observacao)
                val response = apiService.updateStatus(pedidoId, req)
                if (response.isSuccessful) {
                    _statusUpdateSuccess.value = true
                    carregarPedidosEntregador() // recarrega a lista
                } else {
                    _error.value = "Falha ao atualizar status"
                }
            } catch (e: Exception) {
                _error.value = "Erro de rede: ${e.message}"
            }
        }
    }
}
