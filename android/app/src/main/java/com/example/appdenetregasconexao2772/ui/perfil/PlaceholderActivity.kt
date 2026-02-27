package com.example.appdenetregasconexao2772.ui.perfil

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.example.appdenetregasconexao2772.databinding.ActivityPlaceholderBinding
import com.example.appdenetregasconexao2772.R

class PlaceholderActivity : AppCompatActivity() {

    private lateinit var binding: ActivityPlaceholderBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPlaceholderBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val title = intent.getStringExtra("EXTRA_TITLE") ?: "Configuração"
        val iconRes = intent.getIntExtra("EXTRA_ICON", R.drawable.ic_settings)

        binding.toolbar.title = title
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        binding.toolbar.setNavigationOnClickListener { finish() }

        binding.tvPlaceholderTitle.text = title
        binding.ivPlaceholder.setImageResource(iconRes)
        
        when(title) {
            "Editar Perfil" -> binding.tvPlaceholderSubtitle.text = "Em breve você poderá alterar sua senha e foto de perfil."
            "Notificações" -> binding.tvPlaceholderSubtitle.text = "Em breve você poderá configurar alertas de novos pedidos."
            "Configurações" -> binding.tvPlaceholderSubtitle.text = "Em breve você poderá ajustar as preferências do aplicativo."
        }
    }
}
