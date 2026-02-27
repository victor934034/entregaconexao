package com.example.appdenetregasconexao2772.ui.perfil

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.appdenetregasconexao2772.databinding.ActivityConfiguracoesBinding

class ConfiguracoesActivity : AppCompatActivity() {

    private lateinit var binding: ActivityConfiguracoesBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityConfiguracoesBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        binding.toolbar.setNavigationOnClickListener { finish() }

        try {
            val pInfo = packageManager.getPackageInfo(packageName, 0)
            binding.tvVersaoApp.text = pInfo.versionName
        } catch (e: Exception) {
            binding.tvVersaoApp.text = "Desconhecida"
        }

        binding.btnSuporte.setOnClickListener {
            Toast.makeText(this, "Redirecionando para o WhatsApp do suporte...", Toast.LENGTH_SHORT).show()
        }
    }
}
