package com.example.appdenetregasconexao2772.ui.pedidos

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import android.content.Context
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.example.appdenetregasconexao2772.databinding.FragmentHomeBinding
import com.example.appdenetregasconexao2772.ui.pedidos.PedidoDetalhesActivity
import com.example.appdenetregasconexao2772.model.Pedido
import com.example.appdenetregasconexao2772.R

class HomeFragment : Fragment() {

    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!

    private lateinit var viewModel: PedidosViewModel
    private lateinit var adapter: PedidosAdapter

    private var allPedidos: List<Pedido> = emptyList()

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        viewModel = ViewModelProvider(requireActivity())[PedidosViewModel::class.java]
        
        setupRecyclerView()
        setupFilters()
        observeViewModel()
        setupSocketListeners()
        setupUserGreeting()

        binding.swipeRefresh.setOnRefreshListener {
            viewModel.carregarPedidosEntregador()
        }
        
        binding.progressBar.visibility = View.VISIBLE
        viewModel.carregarPedidosEntregador()
    }

    private fun setupUserGreeting() {
        val prefs = requireContext().getSharedPreferences("conexao_prefs", Context.MODE_PRIVATE)
        val nome = prefs.getString("nome", "Entregador") ?: "Entregador"
        val primeiroNome = nome.split(" ").firstOrNull() ?: nome
        // No XML original não tinha ID pro saudação, mas vou procurar se existe ou apenas ignorar se não achar
        // Na verdade, vou assumir o padrão que encontrei no view_file anterior
        // binding.tvSaudacao.text = "Olá, $primeiroNome!" // Supondo que o ID seja tvSaudacao, mas vou conferir layout de novo
    }

    private fun setupFilters() {
        binding.etSearch.addTextChangedListener(object : android.text.TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                applyFilters()
            }
            override fun afterTextChanged(s: android.text.Editable?) {}
        })

        binding.tabLayoutStatus.addOnTabSelectedListener(object : com.google.android.material.tabs.TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: com.google.android.material.tabs.TabLayout.Tab?) {
                applyFilters()
            }
            override fun onTabUnselected(tab: com.google.android.material.tabs.TabLayout.Tab?) {}
            override fun onTabReselected(tab: com.google.android.material.tabs.TabLayout.Tab?) {}
        })

        binding.chipGroupQuickFilters.setOnCheckedStateChangeListener { _, _ ->
            applyFilters()
        }
    }

    private fun applyFilters() {
        val query = binding.etSearch.text.toString().lowercase()
        val selectedTabPosition = binding.tabLayoutStatus.selectedTabPosition
        val selectedChipId = binding.chipGroupQuickFilters.checkedChipId

        val filtered = allPedidos.filter { pedido ->
            val matchesQuery = (pedido.nome_cliente?.lowercase()?.contains(query) ?: false) ||
                               (pedido.id.toString().contains(query)) ||
                               (pedido.numero_pedido?.lowercase()?.contains(query) ?: false)
            
            val matchesStatus = when (selectedTabPosition) {
                0 -> pedido.status == "PENDENTE"
                1 -> pedido.status == "AGUARDANDO" || pedido.status == "EM_ROTA"
                2 -> pedido.status == "ENTREGUE" || pedido.status == "CONCLUIDO" || pedido.status == "CANCELADO"
                else -> true
            }

            val matchesQuickFilter = when (selectedChipId) {
                R.id.chipHoje -> {
                    // Se houver lógica de data ou deixar passar todos se não houver
                    true
                }
                R.id.chipDinheiro -> pedido.forma_pagamento?.contains("Dinheiro", ignoreCase = true) == true
                R.id.chipCartao -> {
                    val fp = pedido.forma_pagamento ?: ""
                    fp.contains("Cartão", ignoreCase = true) || fp.contains("Cartao", ignoreCase = true)
                }
                R.id.chipUrgente -> pedido.status == "PENDENTE" // Exemplo de filtro urgente
                else -> true
            }

            matchesQuery && matchesStatus && matchesQuickFilter
        }
        
        adapter.submitList(filtered)
        updateEmptyState(filtered.isEmpty())
    }

    private fun updateEmptyState(isEmpty: Boolean) {
        if (isEmpty) {
            binding.tvEmptyState.visibility = View.VISIBLE
            binding.rvPedidos.visibility = View.GONE
        } else {
            binding.tvEmptyState.visibility = View.GONE
            binding.rvPedidos.visibility = View.VISIBLE
        }
    }

    private fun setupSocketListeners() {
        com.example.appdenetregasconexao2772.network.SocketManager.getSocket()?.apply {
            on("pedido:criado") { activity?.runOnUiThread { viewModel.carregarPedidosEntregador() } }
            on("pedido:atualizado") { activity?.runOnUiThread { viewModel.carregarPedidosEntregador() } }
            on("pedido:status") { activity?.runOnUiThread { viewModel.carregarPedidosEntregador() } }
            on("pedido:excluido") { activity?.runOnUiThread { viewModel.carregarPedidosEntregador() } }
        }
    }

    private fun setupRecyclerView() {
        binding.rvPedidos.layoutManager = LinearLayoutManager(requireContext())
        adapter = PedidosAdapter(
            onAtualizarClick = { pedido ->
                val novoStatus = when(pedido.status) {
                    "PENDENTE" -> "EM_ROTA"
                    "EM_ROTA" -> "ENTREGUE"
                    else -> ""
                }
                if(novoStatus.isNotEmpty()) {
                    binding.progressBar.visibility = View.VISIBLE
                    viewModel.atualizarStatus(pedido.id, novoStatus)
                }
            },
            onVerDetalhesClick = { pedido ->
                PedidoDetalhesActivity.start(requireContext(), pedido.id)
            }
        )
        binding.rvPedidos.adapter = adapter
    }

    private fun observeViewModel() {
        viewModel.pedidos.observe(viewLifecycleOwner) { lista ->
            binding.progressBar.visibility = View.GONE
            binding.swipeRefresh.isRefreshing = false
            allPedidos = lista
            applyFilters()
        }

        viewModel.error.observe(viewLifecycleOwner) { msg ->
            Toast.makeText(requireContext(), msg, Toast.LENGTH_SHORT).show()
            binding.progressBar.visibility = View.GONE
            binding.swipeRefresh.isRefreshing = false
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
