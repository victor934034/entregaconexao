package com.example.appdenetregasconexao2772.ui.perfil

import android.content.Context
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.appdenetregasconexao2772.databinding.ActivityEditarPerfilBinding
import com.example.appdenetregasconexao2772.model.UpdateProfileRequest
import com.example.appdenetregasconexao2772.network.RetrofitClient
import kotlinx.coroutines.launch

class EditarPerfilActivity : AppCompatActivity() {

    private lateinit var binding: ActivityEditarPerfilBinding
    private val apiService by lazy { RetrofitClient.create(this) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityEditarPerfilBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupToolbar()
        loadCurrentData()

        binding.btnSalvar.setOnClickListener {
            saveChanges()
        }
    }

    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        binding.toolbar.setNavigationOnClickListener { finish() }
    }

    private fun loadCurrentData() {
        val prefs = getSharedPreferences("conexao_prefs", Context.MODE_PRIVATE)
        binding.etNome.setText(prefs.getString("nome", ""))
        binding.etEmail.setText(prefs.getString("email", ""))
    }

    private fun saveChanges() {
        val nome = binding.etNome.text.toString().trim()
        val email = binding.etEmail.text.toString().trim()
        val senha = binding.etSenha.text.toString().trim()

        if (nome.isEmpty() || email.isEmpty()) {
            Toast.makeText(this, "Preencha nome e e-mail", Toast.LENGTH_SHORT).show()
            return
        }

        val prefs = getSharedPreferences("conexao_prefs", Context.MODE_PRIVATE)
        val uid = prefs.getInt("uid", -1)

        if (uid == -1) {
            Toast.makeText(this, "Erro: Usuário não identificado", Toast.LENGTH_SHORT).show()
            return
        }

        lifecycleScope.launch {
            try {
                binding.btnSalvar.isEnabled = false
                binding.btnSalvar.text = "Salvando..."
                
                val request = UpdateProfileRequest(
                    nome = nome,
                    email = email,
                    senha = if (senha.isNotEmpty()) senha else null
                )
                
                val response = apiService.updateProfile(uid, request)
                
                if (response.isSuccessful) {
                    // Atualiza preferências locais
                    prefs.edit().apply {
                        putString("nome", nome)
                        putString("email", email)
                        apply()
                    }
                    Toast.makeText(this@EditarPerfilActivity, "Perfil atualizado com sucesso!", Toast.LENGTH_SHORT).show()
                    finish()
                } else {
                    Toast.makeText(this@EditarPerfilActivity, "Erro ao atualizar: ${response.code()}", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@EditarPerfilActivity, "Erro de rede: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                binding.btnSalvar.isEnabled = true
                binding.btnSalvar.text = "Salvar Alterações"
            }
        }
    }
}
