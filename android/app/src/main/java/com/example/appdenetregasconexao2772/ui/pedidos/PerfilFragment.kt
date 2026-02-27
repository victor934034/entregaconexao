package com.example.appdenetregasconexao2772.ui.pedidos

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import com.example.appdenetregasconexao2772.databinding.FragmentPerfilBinding
import com.example.appdenetregasconexao2772.ui.login.LoginActivity
import com.example.appdenetregasconexao2772.R
import android.widget.ImageView
import android.widget.TextView
import com.example.appdenetregasconexao2772.ui.perfil.PlaceholderActivity

class PerfilFragment : Fragment() {

    private var _binding: FragmentPerfilBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentPerfilBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val prefs = requireContext().getSharedPreferences("conexao_prefs", Context.MODE_PRIVATE)
        val nome = prefs.getString("nome", "Entregador") ?: "Entregador"
        val email = prefs.getString("email", "") ?: ""

        binding.tvNomeEntregador.text = nome
        binding.tvEmailEntregador.text = if (email.isNotEmpty()) email else "Sem e-mail cadastrado"
        binding.tvAvatarInitials.text = getInitials(nome)

        val viewModel = androidx.lifecycle.ViewModelProvider(requireActivity())[PedidosViewModel::class.java]

        setupMenu()
        observeViewModel(viewModel)

        binding.btnLogout.setOnClickListener {
            prefs.edit().clear().apply()
            startActivity(Intent(requireContext(), LoginActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            })
            requireActivity().finish()
        }
    }

    private fun observeViewModel(viewModel: PedidosViewModel) {
        viewModel.totalEntregas.observe(viewLifecycleOwner) { total ->
            binding.tvTotalEntregas.text = total.toString()
        }

        viewModel.totalGanhos.observe(viewLifecycleOwner) { ganhos ->
            binding.tvGanhosProjetados.text = String.format("%.2f", ganhos)
        }
        
        // Garante que carrega os dados se ainda não tiver
        viewModel.carregarPedidosEntregador()
        viewModel.carregarEstatisticas()
    }

    private fun getInitials(nome: String): String {
        val parts = nome.trim().split(" ")
        return if (parts.size >= 2) {
            "${parts[0][0]}${parts[1][0]}".uppercase()
        } else if (parts.isNotEmpty() && parts[0].isNotEmpty()) {
            "${parts[0][0]}".uppercase()
        } else {
            "JD"
        }
    }

    private fun setupMenu() {
        // Editar Perfil
        binding.menuEditProfile.ivMenuIcon.setImageResource(R.drawable.ic_profile)
        binding.menuEditProfile.tvMenuTitle.text = "Editar Perfil"
        binding.menuEditProfile.tvMenuSubtitle.text = "Informações da conta"
        binding.menuEditProfile.root.setOnClickListener {
            val intent = Intent(requireContext(), EditarPerfilActivity::class.java)
            startActivity(intent)
        }

        // Notificações
        binding.menuNotifications.ivMenuIcon.setImageResource(R.drawable.ic_bell)
        binding.menuNotifications.tvMenuTitle.text = "Notificações"
        binding.menuNotifications.tvMenuSubtitle.text = "Configurar alertas"
        binding.menuNotifications.root.setOnClickListener {
            val intent = Intent(requireContext(), PlaceholderActivity::class.java).apply {
                putExtra("EXTRA_TITLE", "Notificações")
                putExtra("EXTRA_ICON", R.drawable.ic_bell)
            }
            startActivity(intent)
        }

        // Histórico
        binding.menuHistory.ivMenuIcon.setImageResource(R.drawable.ic_reports)
        binding.menuHistory.tvMenuTitle.text = "Histórico Global"
        binding.menuHistory.tvMenuSubtitle.text = "Todas as suas entregas"
        binding.menuHistory.root.setOnClickListener {
            // Navega para a aba de pedidos se o usuário clicar no histórico
            (requireActivity() as? com.example.appdenetregasconexao2772.MainActivity)?.let {
                it.findViewById<com.google.android.material.bottomnavigation.BottomNavigationView>(R.id.bottom_navigation)?.selectedItemId = R.id.nav_pedidos
            }
        }

        // Configurações
        binding.menuSettings.ivMenuIcon.setImageResource(R.drawable.ic_settings)
        binding.menuSettings.tvMenuTitle.text = "Configurações"
        binding.menuSettings.tvMenuSubtitle.text = "App e Preferências"
        binding.menuSettings.root.setOnClickListener {
            val intent = Intent(requireContext(), PlaceholderActivity::class.java).apply {
                putExtra("EXTRA_TITLE", "Configurações")
                putExtra("EXTRA_ICON", R.drawable.ic_settings)
            }
            startActivity(intent)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
