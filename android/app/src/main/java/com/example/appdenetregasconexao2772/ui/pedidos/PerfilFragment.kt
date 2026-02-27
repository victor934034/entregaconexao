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
        val perfil = prefs.getString("perfil", "Entregador") ?: "Entregador"

        binding.tvNomeEntregador.text = nome
        binding.tvEmailEntregador.text = if (email.isNotEmpty()) email else "Sem e-mail cadastrado"
        binding.tvPerfilUsuario.text = perfil.uppercase()

        binding.btnLogout.setOnClickListener {
            prefs.edit().clear().apply()
            startActivity(Intent(requireContext(), LoginActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            })
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
