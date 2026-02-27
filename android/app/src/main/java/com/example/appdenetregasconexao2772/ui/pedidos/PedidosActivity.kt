package com.example.appdenetregasconexao2772.ui.pedidos

import android.os.Bundle
import android.view.View
import android.widget.ProgressBar
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.appdenetregasconexao2772.R

class PedidosActivity : AppCompatActivity() {

    private lateinit var viewModel: PedidosViewModel
    private lateinit var adapter: PedidosAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_pedidos)

        viewModel = ViewModelProvider(this)[PedidosViewModel::class.java]

        val rvPedidos = findViewById<RecyclerView>(R.id.rvPedidos)
        val progressBar = findViewById<ProgressBar>(R.id.progressBar)
        val tvEmptyState = findViewById<android.widget.TextView>(R.id.tvEmptyState)

        rvPedidos.layoutManager = LinearLayoutManager(this)
        
        adapter = PedidosAdapter(emptyList()) { pedido ->
            // Exemplo iterativo: se PENDENTE -> vai para EM_ROTA. Se EM_ROTA -> vai para ENTREGUE
            val novoStatus = when(pedido.status) {
                "PENDENTE" -> "EM_ROTA"
                "EM_ROTA" -> "ENTREGUE"
                else -> ""
            }
            if(novoStatus.isNotEmpty()) {
                progressBar.visibility = View.VISIBLE
                viewModel.atualizarStatus(pedido.id, novoStatus)
            } else {
                Toast.makeText(this, "Pedido já está ${pedido.status}", Toast.LENGTH_SHORT).show()
            }
        }
        rvPedidos.adapter = adapter

        viewModel.pedidos.observe(this) { lista ->
            progressBar.visibility = View.GONE
            if (lista.isEmpty()) {
                tvEmptyState.visibility = View.VISIBLE
                rvPedidos.visibility = View.GONE
                // Se o usuário acabou de logar e não tem pedidos, damos as boas-vindas
                Toast.makeText(this, "Bem-vindo! No momento não há pedidos vinculados a você.", Toast.LENGTH_LONG).show()
            } else {
                tvEmptyState.visibility = View.GONE
                rvPedidos.visibility = View.VISIBLE
                adapter.submitList(lista)
            }
        }

        viewModel.statusUpdateSuccess.observe(this) { success ->
            if (success) {
                Toast.makeText(this, "Status atualizado com sucesso!", Toast.LENGTH_SHORT).show()
            }
            progressBar.visibility = View.GONE
        }

        viewModel.error.observe(this) { errorMsg ->
            Toast.makeText(this, errorMsg, Toast.LENGTH_LONG).show()
            progressBar.visibility = View.GONE
        }

        // Carrega inicial
        progressBar.visibility = View.VISIBLE
        viewModel.carregarPedidosEntregador()
    }
}
