package com.example.appdenetregasconexao2772

import android.content.Intent
import android.os.Bundle
import android.widget.ImageView
import android.widget.TextView
import com.example.appdenetregasconexao2772.ui.perfil.PlaceholderActivity
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import com.example.appdenetregasconexao2772.databinding.ActivityMainBinding
import com.example.appdenetregasconexao2772.ui.pedidos.CalendarioFragment
import com.example.appdenetregasconexao2772.ui.pedidos.HomeFragment
import com.example.appdenetregasconexao2772.ui.pedidos.PerfilFragment

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val prefs = getSharedPreferences("conexao_prefs", MODE_PRIVATE)
        val token = prefs.getString("token", null)

        if (token == null) {
            startActivity(Intent(this, com.example.appdenetregasconexao2772.ui.login.LoginActivity::class.java))
            finish()
            return
        }

        // Carrega o fragment inicial
        if (savedInstanceState == null) {
            switchFragment(HomeFragment())
        }

        // Conecta ao Socket.io para atualizações em tempo real
        com.example.appdenetregasconexao2772.network.SocketManager.connect()

        binding.bottomNavigation.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_pedidos -> { switchFragment(HomeFragment()); true }
                R.id.nav_calendario -> { switchFragment(CalendarioFragment()); true }
                R.id.nav_perfil -> { switchFragment(PerfilFragment()); true }
                else -> false
            }
        }
    }

    private fun switchFragment(fragment: Fragment) {
        supportFragmentManager.beginTransaction()
            .replace(R.id.nav_host_fragment, fragment)
            .commit()
    }
}
