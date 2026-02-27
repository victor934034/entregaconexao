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
import com.example.appdenetregasconexao2772.R

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

    private var currentPedido: Pedido? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPedidoDetalhesBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val pedidoId = intent.getIntExtra(EXTRA_PEDIDO_ID, -1)
        if (pedidoId == -1) { finish(); return }

        setupToolbar()
        setupListeners()
        carregarDetalhes(pedidoId)
    }

    private fun setupToolbar() {
        binding.toolbar.setNavigationOnClickListener {
            finish()
        }
    }

    private fun setupListeners() {
        binding.btnChat.setOnClickListener {
            val fone = currentPedido?.celular_cliente ?: currentPedido?.telefone_cliente
            if (fone.isNullOrEmpty()) {
                Toast.makeText(this, "Número não disponível", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            
            val msg = "Olá, sou o entregador do seu pedido ${currentPedido?.numero_pedido}"
            val intent = Intent(Intent.ACTION_VIEW)
            val phoneClean = fone.replace(Regex("[^0-9]"), "")
            val url = "https://api.whatsapp.com/send?phone=+55$phoneClean&text=${android.net.Uri.encode(msg)}"
            
            try {
                intent.data = android.net.Uri.parse(url)
                startActivity(intent)
            } catch (e: Exception) {
                // Fallback para SMS
                val smsIntent = Intent(Intent.ACTION_SENDTO, android.net.Uri.parse("smsto:$fone"))
                smsIntent.putExtra("sms_body", msg)
                startActivity(smsIntent)
            }
        }

        binding.btnCall.setOnClickListener {
            val fone = currentPedido?.telefone_cliente ?: currentPedido?.celular_cliente
            if (fone.isNullOrEmpty()) {
                Toast.makeText(this, "Número não disponível", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            val intent = Intent(Intent.ACTION_DIAL, android.net.Uri.parse("tel:$fone"))
            startActivity(intent)
        }

        binding.btnAbrirMapa.setOnClickListener {
            openMap()
        }
        binding.mapCard.setOnClickListener {
            openMap()
        }
        binding.btnReportError.setOnClickListener {
            Toast.makeText(this, "Relatório de erro enviado", Toast.LENGTH_SHORT).show()
        }
        binding.btnSairPedido.setOnClickListener {
            finish()
        }
    }

    private fun openMap() {
        val endereco = binding.tvEnderecoDetalhe.text.toString()
        if (endereco.isEmpty() || endereco.contains("não informado")) {
            Toast.makeText(this, "Endereço não disponível", Toast.LENGTH_SHORT).show()
            return
        }

        val mapIntentUri = android.net.Uri.parse("geo:0,0?q=${android.net.Uri.encode(endereco)}")
        val mapIntent = Intent(Intent.ACTION_VIEW, mapIntentUri)
        mapIntent.setPackage("com.google.android.apps.maps")
        
        try {
            startActivity(mapIntent)
        } catch (e: Exception) {
            val genericIntent = Intent(Intent.ACTION_VIEW, mapIntentUri)
            if (genericIntent.resolveActivity(packageManager) != null) {
                startActivity(genericIntent)
            } else {
                Toast.makeText(this, "Nenhum aplicativo de mapas encontrado", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun carregarDetalhes(pedidoId: Int) {
        val viewModel = ViewModelProvider(this)[PedidosViewModel::class.java]
        
        binding.progressBar.visibility = View.VISIBLE
        viewModel.carregarDetalhesPedido(pedidoId)
  
        viewModel.pedidoDetalhe.observe(this) { pedido ->
            binding.progressBar.visibility = View.GONE
            pedido ?: return@observe
            this.currentPedido = pedido
            preencherTela(pedido)
            setupActionButton(pedido, viewModel)
        }
  
        viewModel.error.observe(this) { msg ->
            binding.progressBar.visibility = View.GONE
            Toast.makeText(this, msg, Toast.LENGTH_LONG).show()
        }
    }

    private fun preencherTela(pedido: Pedido) {
        binding.tvClienteDetalhe.text = pedido.nome_cliente ?: "Sem nome"
        binding.tvEnderecoDetalhe.text = "${pedido.logradouro ?: "Endereço não informado"}, ${pedido.numero_end ?: ""} – ${pedido.bairro ?: ""}"
        
        val total = pedido.total_liquido ?: 0.0
        binding.tvTotalDetalhe.text = String.format("R$ %.2f", total)
        binding.tvSubtotal.text = String.format("R$ %.2f", total)
        
        // Formatar total_itens
        val totalItens = pedido.total_itens ?: 0.0
        val countStr = if (totalItens % 1.0 == 0.0) {
            "${totalItens.toInt()}"
        } else {
            String.format("%.3f", totalItens)
        }
        binding.tvTotalItens.text = "$countStr item(ns)"

        // Agendamento (Novo)
        if (!pedido.data_entrega_programada.isNullOrEmpty() || !pedido.hora_entrega_programada.isNullOrEmpty()) {
            binding.cardAgendamento.visibility = View.VISIBLE
            val data = pedido.data_entrega_programada ?: "Data não informada"
            val hora = pedido.hora_entrega_programada ?: ""
            binding.tvAgendamentoInfo.text = if (hora.isNotEmpty()) "$data às $hora" else data
        } else {
            binding.cardAgendamento.visibility = View.GONE
        }

        if (!pedido.observacao_endereco.isNullOrEmpty()) {
            binding.llAvisoEndereco.visibility = View.VISIBLE
            binding.tvAvisoEndereco.text = pedido.observacao_endereco
        } else {
            binding.llAvisoEndereco.visibility = View.GONE
        }

        preencherProdutos(pedido.itens)
        preencherTimeline(pedido.historicos, pedido.status ?: "PENDENTE")
    }

    private fun preencherProdutos(itens: List<com.example.appdenetregasconexao2772.model.ItemPedido>?) {
        binding.llProdutos.removeAllViews()
        if (itens.isNullOrEmpty()) {
            val emptyTv = TextView(this)
            emptyTv.text = "Nenhum item"
            binding.llProdutos.addView(emptyTv)
            return
        }

        for (item in itens) {
            val itemView = layoutInflater.inflate(R.layout.item_produto_detalhe, binding.llProdutos, false)
            itemView.findViewById<TextView>(R.id.tvProdutoNome).text = item.descricao
            
            val qtdFormatada = if (item.quantidade % 1.0 == 0.0) {
                String.format("%d", item.quantidade.toInt())
            } else {
                String.format("%.3f", item.quantidade)
            }
            
            itemView.findViewById<TextView>(R.id.tvProdutoQtd).text = qtdFormatada
            itemView.findViewById<TextView>(R.id.tvProdutoUnidade).text = item.unidade ?: "UN"
            
            // Ocultar preço pois não é usado aqui
            itemView.findViewById<TextView>(R.id.tvProdutoPreco).visibility = View.GONE
            
            binding.llProdutos.addView(itemView)
        }
    }

    private fun preencherTimeline(historicos: List<com.example.appdenetregasconexao2772.model.HistoricoStatus>?, statusAtual: String) {
        binding.llHistorico.removeAllViews()
        if (historicos.isNullOrEmpty()) {
            addTimelineItem("Pedido no status: $statusAtual", "Atualizado agora")
            return
        }

        for ((index, hist) in historicos.withIndex()) {
            val timelineView = layoutInflater.inflate(R.layout.item_timeline, binding.llHistorico, false)
            val tvStatus = timelineView.findViewById<TextView>(R.id.tvTimelineStatus)
            val tvData = timelineView.findViewById<TextView>(R.id.tvTimelineData)
            val viewLine = timelineView.findViewById<View>(R.id.viewLine)

            tvStatus.text = "Status: ${hist.status_para ?: "---"}"
            tvData.text = hist.data_alteracao ?: "Data não informada"

            if (index == historicos.size - 1) {
                viewLine.visibility = View.GONE
            }
            binding.llHistorico.addView(timelineView)
        }
    }

    private fun addTimelineItem(status: String, data: String) {
        val timelineView = layoutInflater.inflate(R.layout.item_timeline, binding.llHistorico, false)
        timelineView.findViewById<TextView>(R.id.tvTimelineStatus).text = status
        timelineView.findViewById<TextView>(R.id.tvTimelineData).text = data
        timelineView.findViewById<View>(R.id.viewLine).visibility = View.GONE
        binding.llHistorico.addView(timelineView)
    }

    private fun setupActionButton(pedido: Pedido, viewModel: PedidosViewModel) {
        val btn = binding.btnUpdateStatus
        when(pedido.status) {
            "PENDENTE" -> {
                btn.text = "Aceitar Pedido"
                btn.visibility = View.VISIBLE
                btn.setOnClickListener {
                    viewModel.atualizarStatus(pedido.id, "EM_ROTA")
                }
            }
            "EM_ROTA" -> {
                btn.text = "Finalizar Entrega"
                btn.visibility = View.VISIBLE
                btn.setOnClickListener {
                    viewModel.atualizarStatus(pedido.id, "ENTREGUE")
                }
            }
            else -> {
                btn.visibility = View.GONE
            }
        }
    }
}
