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
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.isActive

class PedidosViewModel(application: Application) : AndroidViewModel(application) {
    private val apiService = RetrofitClient.create(application)
    private var pollingJob: Job? = null

    private val _sessionExpired = MutableLiveData<Boolean>()
    val sessionExpired: LiveData<Boolean> = _sessionExpired

    private val _pedidoDetalhe = MutableLiveData<Pedido>()
    val pedidoDetalhe: LiveData<Pedido> = _pedidoDetalhe

    private val _error = MutableLiveData<String>()
    val error: LiveData<String> = _error

    private val _pedidos = MutableLiveData<List<Pedido>>()
    val pedidos: LiveData<List<Pedido>> = _pedidos

    private val _totalEntregas = MutableLiveData<Int>()
    val totalEntregas: LiveData<Int> = _totalEntregas

    private val _totalGanhos = MutableLiveData<Double>()
    val totalGanhos: LiveData<Double> = _totalGanhos

    private val calendarCache = mutableMapOf<String, List<Pedido>>()

    private val _statusUpdateSuccess = MutableLiveData<Boolean>()
    val statusUpdateSuccess: LiveData<Boolean> = _statusUpdateSuccess
    fun carregarDetalhesPedido(pedidoId: Int) {
        viewModelScope.launch {
            try {
                val response = apiService.getPedidoDetalhes(pedidoId)
                if (response.isSuccessful) {
                    _pedidoDetalhe.value = response.body()
                } else if (response.code() == 401) {
                    handleUnauthorized()
                } else {
                    _error.value = "Falha ao buscar detalhes"
                }
            } catch (e: Exception) {
                if (e is CancellationException) throw e
                if (e !is java.net.UnknownHostException) {
                    _error.value = "Erro de rede: ${e.message}"
                }
            }
        }
    }

    private fun handleUnauthorized() {
        val prefs = getApplication<Application>().getSharedPreferences("conexao_prefs", Context.MODE_PRIVATE)
        val token = prefs.getString("token", null)
        
        if (!token.isNullOrEmpty()) {
            android.util.Log.e("PedidosViewModel", "Sessão invalidada (401). Removendo token.")
            prefs.edit().remove("token").apply()
            _sessionExpired.value = true
            _error.value = "Sessão expirada. Faça login novamente."
        }
    }

    fun carregarPedidosEntregador() {
        val prefs = getApplication<Application>().getSharedPreferences("conexao_prefs", Context.MODE_PRIVATE)
        val uid = prefs.getInt("uid", -1)
        if(uid == -1) return
        viewModelScope.launch {
            try {
                val response = apiService.getPedidosEntregador(uid)
                if (response.isSuccessful) {
                    val lista = response.body() ?: emptyList()
                    _pedidos.value = lista
                    
                    // Cálculo de estatísticas reais
                    val entregues = lista.filter { it.status == "ENTREGUE" || it.status == "CONCLUIDO" }
                    _totalEntregas.value = entregues.size
                    _totalGanhos.value = entregues.sumOf { it.total_liquido ?: 0.0 }
                } else if (response.code() == 401) {
                    handleUnauthorized()
                } else {
                    _error.value = "Falha ao carregar pedidos: ${response.code()}"
                }
            } catch (e: Exception) {
                if (e is CancellationException) throw e
                if (e !is java.net.UnknownHostException || _pedidos.value.isNullOrEmpty()) {
                    _error.value = "Erro de rede: ${e.message}"
                }
            }
        }
    }

    fun carregarPedidosPorData(uid: Int, data: String) {
        if (calendarCache.containsKey(data)) {
            _pedidos.value = calendarCache[data]
            return
        }

        viewModelScope.launch {
            try {
                val dataFim = data + "T23:59:59"
                val dataInicio = data + "T00:00:00"
                val response = apiService.getPedidosEntregador(uid, dataInicio, dataFim)
                if (response.isSuccessful) {
                    val list = response.body() ?: emptyList()
                    calendarCache[data] = list
                    _pedidos.value = list
                } else if (response.code() == 401) {
                    handleUnauthorized()
                } else {
                    _error.value = "Falha ao carregar pedidos da data"
                }
            } catch (e: Exception) {
                if (e is CancellationException) throw e
                if (e !is java.net.UnknownHostException) {
                    _error.value = "Erro de rede: ${e.message}"
                }
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
                    carregarPedidosEntregador()
                    carregarEstatisticas()
                    carregarDetalhesPedido(pedidoId)
                } else if (response.code() == 401) {
                    handleUnauthorized()
                } else {
                    _error.value = "Falha ao atualizar status"
                }
            } catch (e: Exception) {
                if (e is CancellationException) throw e
                _error.value = "Erro ao atualizar: ${e.message}"
            }
        }
    }

    fun carregarEstatisticas() {
        val prefs = getApplication<Application>().getSharedPreferences("conexao_prefs", Context.MODE_PRIVATE)
        val uid = prefs.getInt("uid", -1)
        if(uid == -1) return

        viewModelScope.launch {
            try {
                val response = apiService.getUserStats(uid)
                if (response.isSuccessful) {
                    val stats = response.body()
                    _totalEntregas.value = stats?.total_entregas ?: 0
                    _totalGanhos.value = stats?.ganhos ?: 0.0
                } else if (response.code() == 401) {
                    handleUnauthorized()
                }
            } catch (e: Exception) {}
        }
    }

    fun startPolling() {
        val prefs = getApplication<Application>().getSharedPreferences("conexao_prefs", Context.MODE_PRIVATE)
        val uid = prefs.getInt("uid", -1)
        if (uid == -1) return

        pollingJob?.cancel()
        pollingJob = viewModelScope.launch {
            while(isActive) {
                try {
                    val response = apiService.getPedidosEntregador(uid)
                    if (response.isSuccessful) {
                        val lista = response.body() ?: emptyList()
                        _pedidos.value = lista
                        val entregues = lista.filter { it.status == "ENTREGUE" || it.status == "CONCLUIDO" }
                        _totalEntregas.value = entregues.size
                        _totalGanhos.value = entregues.sumOf { it.total_liquido ?: 0.0 }
                    } else if (response.code() == 401) {
                        handleUnauthorized()
                    }
                } catch (e: Exception) {
                    if (e is CancellationException) throw e
                    // Ignora erros de rede durante o polling para não spammar toasts
                }
                delay(10000) // 10 segundos
            }
        }
    }

    fun stopPolling() {
        pollingJob?.cancel()
        pollingJob = null
    }
}
