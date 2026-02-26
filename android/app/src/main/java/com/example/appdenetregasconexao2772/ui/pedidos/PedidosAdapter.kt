package com.example.appdenetregasconexao2772.ui.pedidos

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.appdenetregasconexao2772.R
import com.example.appdenetregasconexao2772.model.Pedido

class PedidosAdapter(
    private var pedidos: List<Pedido>,
    private val onAtualizarClick: (Pedido) -> Unit
) : RecyclerView.Adapter<PedidosAdapter.PedidoViewHolder>() {

    class PedidoViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvNumeroPedido: TextView = view.findViewById(R.id.tvNumeroPedido)
        val tvStatus: TextView = view.findViewById(R.id.tvStatus)
        val tvCliente: TextView = view.findViewById(R.id.tvCliente)
        val tvEndereco: TextView = view.findViewById(R.id.tvEndereco)
        val btnAtualizar: Button = view.findViewById(R.id.btnAtualizar)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PedidoViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_pedido, parent, false)
        return PedidoViewHolder(view)
    }

    override fun onBindViewHolder(holder: PedidoViewHolder, position: Int) {
        val pedido = pedidos[position]
        holder.tvNumeroPedido.text = "Pedido #${pedido.numero_pedido}"
        holder.tvStatus.text = pedido.status
        holder.tvCliente.text = pedido.nome_cliente
        holder.tvEndereco.text = "${pedido.logradouro}, ${pedido.numero_end} - ${pedido.bairro}"

        holder.btnAtualizar.setOnClickListener {
            onAtualizarClick(pedido)
        }
    }

    override fun getItemCount() = pedidos.size

    fun submitList(newList: List<Pedido>) {
        pedidos = newList
        notifyDataSetChanged()
    }
}
