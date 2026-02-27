package com.example.appdenetregasconexao2772.ui.pedidos

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.appdenetregasconexao2772.databinding.FragmentHomeBinding

class HomeFragment : Fragment() {

    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!

    private lateinit var viewModel: PedidosViewModel
    private lateinit var adapter: PedidosAdapter

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        viewModel = ViewModelProvider(this)[PedidosViewModel::class.java]
        
        setupRecyclerView()
        observeViewModel()
        
        binding.progressBar.visibility = View.VISIBLE
        viewModel.carregarPedidosEntregador()
    }

    private fun setupRecyclerView() {
        binding.rvPedidos.layoutManager = LinearLayoutManager(requireContext())
        adapter = PedidosAdapter(emptyList()) { pedido ->
            // Clique para atualizar status (mesma lógica anterior)
            val novoStatus = when(pedido.status) {
                "PENDENTE" -> "EM_ROTA"
                "EM_ROTA" -> "ENTREGUE"
                else -> ""
            }
            if(novoStatus.isNotEmpty()) {
                binding.progressBar.visibility = View.VISIBLE
                viewModel.atualizarStatus(pedido.id, novoStatus)
            }
        }
        binding.rvPedidos.adapter = adapter
    }

    private fun observeViewModel() {
        viewModel.pedidos.observe(viewLifecycleOwner) { lista ->
            binding.progressBar.visibility = View.GONE
            if (lista.isEmpty()) {
                binding.tvEmptyState.visibility = View.VISIBLE
                binding.rvPedidos.visibility = View.GONE
            } else {
                binding.tvEmptyState.visibility = View.GONE
                binding.rvPedidos.visibility = View.VISIBLE
                adapter.submitList(lista)
            }
        }

        viewModel.error.observe(viewLifecycleOwner) { msg ->
            Toast.makeText(requireContext(), msg, Toast.LENGTH_SHORT).show()
            binding.progressBar.visibility = View.GONE
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
