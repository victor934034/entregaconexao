package com.example.appdenetregasconexao2772.ui.login

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import com.example.appdenetregasconexao2772.R
import com.example.appdenetregasconexao2772.ui.pedidos.PedidosActivity

class LoginActivity : AppCompatActivity() {

    private lateinit var viewModel: LoginViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        val prefs = getSharedPreferences("conexao_prefs", Context.MODE_PRIVATE)
        if (prefs.getString("token", null) != null) {
            startActivity(Intent(this, PedidosActivity::class.java))
            finish()
            return
        }

        viewModel = ViewModelProvider(this)[LoginViewModel::class.java]

        val etEmail = findViewById<EditText>(R.id.etEmail)
        val etSenha = findViewById<EditText>(R.id.etSenha)
        val btnLogin = findViewById<Button>(R.id.btnLogin)
        val rgPerfil = findViewById<android.widget.RadioGroup>(R.id.rgPerfil)
        val tvRegistrar = findViewById<android.widget.TextView>(R.id.tvRegistrar)
        val progressBar = findViewById<ProgressBar>(R.id.progressBar)

        rgPerfil.setOnCheckedChangeListener { _, checkedId ->
            if (checkedId == R.id.rbEntregador) {
                tvRegistrar.visibility = View.VISIBLE
            } else {
                tvRegistrar.visibility = View.GONE
            }
        }

        tvRegistrar.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }

        viewModel.loginResult.observe(this) { result ->
            progressBar.visibility = View.GONE
            btnLogin.isEnabled = true
            
            result.onSuccess {
                val usuario = it.usuario
                val rbEntregador = findViewById<android.widget.RadioButton>(R.id.rbEntregador)
                
                // Validação de perfil (mesma lógica da web)
                if (rbEntregador.isChecked && usuario.perfil != "ENTREGADOR") {
                    Toast.makeText(this, "Este acesso é exclusivo para entregadores", Toast.LENGTH_LONG).show()
                } else if (!rbEntregador.isChecked && usuario.perfil == "ENTREGADOR") {
                    Toast.makeText(this, "Este acesso é exclusivo para administradores", Toast.LENGTH_LONG).show()
                } else {
                    Toast.makeText(this, "Bem-vindo!", Toast.LENGTH_SHORT).show()
                    startActivity(Intent(this, PedidosActivity::class.java))
                    finish()
                }
            }.onFailure {
                Toast.makeText(this, it.message, Toast.LENGTH_LONG).show()
            }
        }

        btnLogin.setOnClickListener {
            val email = etEmail.text.toString()
            val senha = etSenha.text.toString()

            if (email.isNotEmpty() && senha.isNotEmpty()) {
                progressBar.visibility = View.VISIBLE
                btnLogin.isEnabled = false
                viewModel.login(email, senha)
            } else {
                Toast.makeText(this, "Preencha todos os campos", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
