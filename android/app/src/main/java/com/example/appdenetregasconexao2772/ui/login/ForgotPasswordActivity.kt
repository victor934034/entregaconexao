package com.example.appdenetregasconexao2772.ui.login

import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import com.example.appdenetregasconexao2772.R

class ForgotPasswordActivity : AppCompatActivity() {

    private lateinit var viewModel: LoginViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_forgot_password)

        viewModel = ViewModelProvider(this)[LoginViewModel::class.java]

        val etEmail = findViewById<EditText>(R.id.etEmail)
        val btnReset = findViewById<Button>(R.id.btnReset)
        val btnBack = findViewById<Button>(R.id.btnBack)
        val progressBar = findViewById<ProgressBar>(R.id.progressBar)

        btnBack.setOnClickListener {
            finish()
        }

        btnReset.setOnClickListener {
            val email = etEmail.text.toString().trim()

            if (email.isEmpty() || !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
                Toast.makeText(this, "Informe um e-mail válido", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            progressBar.visibility = View.VISIBLE
            btnReset.isEnabled = false
            
            viewModel.forgotPassword(email)
        }

        viewModel.forgotPasswordResult?.observe(this) { result ->
            progressBar.visibility = View.GONE
            btnReset.isEnabled = true
            
            if (result.isSuccess) {
                Toast.makeText(this, "Verifique seu e-mail para instruções.", Toast.LENGTH_LONG).show()
                finish()
            } else {
                Toast.makeText(this, result.exceptionOrNull()?.message ?: "Erro ao processar", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
