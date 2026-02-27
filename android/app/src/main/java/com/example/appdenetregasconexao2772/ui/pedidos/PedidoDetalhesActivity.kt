package com.example.appdenetregasconexao2772.ui.pedidos

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import com.example.appdenetregasconexao2772.databinding.ActivityPedidoDetalhesBinding
import com.example.appdenetregasconexao2772.model.Pedido

class PedidoDetalhesActivity : AppCompatActivity() {

    private lateinit var binding: ActivityPedidoDetalhesBinding

    companion object {
        const val EXTRA_PEDIDO_ID = "pedido_id"
        fun start(context: Context, pedidoId: Int) {
            context.startActivity(Intent(context, PedidoDetalhesActivity::class.java).apply {
                putExtra(EXTRA_PEDIDO_ID, pedidoId)
            })
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPedidoDetalhesBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val pedidoId = intent.getIntExtra(EXTRA_PEDIDO_ID, -1)
        if (pedidoId == -1) { finish(); return }

        carregarDetalhes(pedidoId)
    }

    private fun carregarDetalhes(pedidoId: Int) {
        // Usamos o ViewModel para buscar detalhes
        val viewModel = ViewModelProvider(this)[PedidosViewModel::class.java]
        viewModel.carregarDetalhesPedido(pedidoId)

        viewModel.pedidoDetalhe.observe(this) { pedido ->
            pedido ?: return@observe
            preencherTela(pedido)
        }

        viewModel.error.observe(this) { msg ->
            Toast.makeText(this, msg, Toast.LENGTH_LONG).show()
        }
    }

    private fun preencherTela(pedido: Pedido) {
        binding.tvNumPedido.text = "Pedido #${pedido.numero_pedido}"
        binding.tvStatusDetalhe.text = pedido.status
        binding.tvClienteDetalhe.text = pedido.nome_cliente
        binding.tvEnderecoDetalhe.text = "${pedido.logradouro}, ${pedido.numero_end} – ${pedido.bairro}"

        // Preenche produtos
        binding.llProdutos.removeAllViews()
        val itens = pedido.itens
        if (itens.isNullOrEmpty()) {
            addTextRow(binding.llProdutos, "Nenhum produto cadastrado neste pedido.")
        } else {
            for (item in itens) {
                val qnt = if (item.quantidade == item.quantidade.toLong().toDouble())
                    item.quantidade.toLong().toString()
                else item.quantidade.toString()
                val unidade = item.unidade ?: ""
                val desc = item.descricao
                addTextRow(binding.llProdutos, "• $qnt $unidade – $desc")
            }
        }
    }

    private fun addTextRow(container: LinearLayout, text: String) {
        val tv = TextView(this)
        tv.text = text
        tv.textSize = 15f
        tv.setTextColor(0xFF374151.toInt())
        val params = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        )
        params.topMargin = 4
        tv.layoutParams = params
        container.addView(tv)
    }
}
