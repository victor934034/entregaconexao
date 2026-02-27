package com.example.appdenetregasconexao2772.ui.pedidos

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.appdenetregasconexao2772.R
import com.example.appdenetregasconexao2772.model.Pedido

class PedidosAdapter(
    private val onAtualizarClick: (Pedido) -> Unit,
    private val onVerDetalhesClick: ((Pedido) -> Unit)? = null
) : ListAdapter<Pedido, PedidosAdapter.PedidoViewHolder>(PedidoDiffCallback()) {

    class PedidoViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvNumeroPedido: TextView = view.findViewById(R.id.tvNumeroPedido)
        val tvStatus: TextView = view.findViewById(R.id.tvStatus)
        val tvCliente: TextView = view.findViewById(R.id.tvCliente)
        val tvValorTotal: TextView = view.findViewById(R.id.tvValorTotal)
        val tvItensCount: TextView = view.findViewById(R.id.tvItensCount)
        val btnVerDetalhes: Button = view.findViewById(R.id.btnVerDetalhes)
        val btnAcao: Button = view.findViewById(R.id.btnAcao)
        val layoutAgendamento: View = view.findViewById(R.id.layoutAgendamento)
        val tvAgendamento: TextView = view.findViewById(R.id.tvAgendamento)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PedidoViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_pedido, parent, false)
        return PedidoViewHolder(view)
    }

    override fun onBindViewHolder(holder: PedidoViewHolder, position: Int) {
        val pedido = getItem(position)
        val context = holder.itemView.context
        
        holder.tvNumeroPedido.text = "ID #${pedido.numero_pedido ?: pedido.id}"
        holder.tvCliente.text = pedido.nome_cliente ?: "Cliente não identificado"
        holder.tvValorTotal.text = String.format("R$ %.2f", pedido.total_liquido ?: 0.0)
        var totalItens = pedido.total_itens ?: 0.0
        if (totalItens == 0.0 && !pedido.itens.isNullOrEmpty()) {
            totalItens = pedido.itens.sumOf { it.quantidade }
        }
        
        val countStr = if (totalItens % 1.0 == 0.0) {
            "${totalItens.toInt()}"
        } else {
            String.format("%.2f", totalItens)
        }
        holder.tvItensCount.text = "$countStr item(ns)"

        // Exibição de Agendamento
        if (!pedido.data_entrega_programada.isNullOrEmpty()) {
            holder.layoutAgendamento.visibility = View.VISIBLE
            val dataPura = pedido.data_entrega_programada.split("T")[0] // Pega apenas YYYY-MM-DD se houver T
            val partes = dataPura.split("-")
            val dataFormatada = if (partes.size == 3) "${partes[2]}/${partes[1]}/${partes[0]}" else dataPura
            
            val info = if (!pedido.hora_entrega_programada.isNullOrEmpty()) {
                "Entrega: $dataFormatada às ${pedido.hora_entrega_programada}"
            } else {
                "Entrega: $dataFormatada"
            }
            holder.tvAgendamento.text = info
        } else {
            holder.layoutAgendamento.visibility = View.GONE
        }

        holder.tvStatus.text = pedido.status

        // Configuração do Status
        configurarStatus(holder.tvStatus, pedido.status ?: "PENDENTE")

        // Texto dinâmico do botão de ação
        holder.btnAcao.text = when(pedido.status) {
            "PENDENTE" -> "Aceitar Pedido"
            "EM_ROTA" -> "Finalizar Entrega"
            else -> "Aceitar Pedido"
        }
        
        if (pedido.status == "ENTREGUE") {
            holder.btnAcao.visibility = View.GONE
        } else {
            holder.btnAcao.visibility = View.VISIBLE
        }

        holder.btnAcao.setOnClickListener {
            onAtualizarClick(pedido)
        }

        holder.btnVerDetalhes.setOnClickListener {
            onVerDetalhesClick?.invoke(pedido)
        }

        holder.itemView.setOnClickListener {
            onVerDetalhesClick?.invoke(pedido)
        }
    }

    private fun configurarStatus(textView: TextView, status: String) {
        val context = textView.context
        val (bgRes, textColor) = when(status) {
            "PENDENTE" -> R.color.status_pending_bg to R.color.status_pending_text
            "AGUARDANDO" -> R.color.status_waiting_bg to R.color.status_waiting_text
            "EM_ROTA" -> R.color.status_waiting_bg to R.color.status_waiting_text
            "ENTREGUE", "CONCLUIDO" -> R.color.status_success_bg to R.color.status_success_text
            "CANCELADO" -> R.color.status_error_bg to R.color.status_error_text
            else -> R.color.status_pending_bg to R.color.status_pending_text
        }
        
        textView.setBackgroundResource(R.drawable.bg_status_badge)
        textView.backgroundTintList = android.content.res.ColorStateList.valueOf(context.getColor(bgRes))
        textView.setTextColor(context.getColor(textColor))
    }

    private class PedidoDiffCallback : DiffUtil.ItemCallback<Pedido>() {
        override fun areItemsTheSame(oldItem: Pedido, newItem: Pedido): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: Pedido, newItem: Pedido): Boolean {
            return oldItem == newItem
        }
    }
}
