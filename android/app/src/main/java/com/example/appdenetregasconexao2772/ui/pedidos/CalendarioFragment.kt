package com.example.appdenetregasconexao2772.ui.pedidos

import android.content.Context
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.appdenetregasconexao2772.databinding.FragmentCalendarioBinding
import java.text.SimpleDateFormat
import java.util.*

class CalendarioFragment : Fragment() {

    private var _binding: FragmentCalendarioBinding? = null
    private val binding get() = _binding!!

    private lateinit var viewModel: PedidosViewModel
    private lateinit var adapter: PedidosAdapter
    private val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentCalendarioBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        viewModel = ViewModelProvider(this)[PedidosViewModel::class.java]

        adapter = PedidosAdapter(
            pedidos = emptyList(),
            onAtualizarClick = {},
            onVerDetalhesClick = { pedido ->
                PedidoDetalhesActivity.start(requireContext(), pedido.id)
            }
        )
        binding.rvPedidosHistorico.layoutManager = LinearLayoutManager(requireContext())
        binding.rvPedidosHistorico.adapter = adapter

        // Carrega pedidos do dia atual ao abrir
        val hoje = sdf.format(Date())
        binding.tvDateTitle.text = "Pedidos de: $hoje"
        carregarPorData(hoje)

        binding.calendarView.setOnDateChangeListener { _, year, month, dayOfMonth ->
            val dataSelecionada = String.format("%04d-%02d-%02d", year, month + 1, dayOfMonth)
            binding.tvDateTitle.text = "Pedidos de: ${String.format("%02d/%02d/%04d", dayOfMonth, month + 1, year)}"
            carregarPorData(dataSelecionada)
        }

        viewModel.pedidos.observe(viewLifecycleOwner) { lista ->
            binding.progressBar.visibility = View.GONE
            adapter.submitList(lista)
            if (lista.isEmpty()) {
                Toast.makeText(requireContext(), "Nenhum pedido nesta data.", Toast.LENGTH_SHORT).show()
            }
        }

        viewModel.error.observe(viewLifecycleOwner) { msg ->
            Toast.makeText(requireContext(), msg, Toast.LENGTH_SHORT).show()
            binding.progressBar.visibility = View.GONE
        }
    }

    private fun carregarPorData(data: String) {
        binding.progressBar.visibility = View.VISIBLE
        val prefs = requireContext().getSharedPreferences("conexao_prefs", Context.MODE_PRIVATE)
        val uid = prefs.getInt("uid", -1)
        if (uid != -1) {
            viewModel.carregarPedidosPorData(uid, data)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
