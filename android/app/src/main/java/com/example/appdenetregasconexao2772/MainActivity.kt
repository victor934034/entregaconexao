package com.example.appdenetregasconexao2772

import android.os.Bundle
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

        // Carrega o fragment inicial
        if (savedInstanceState == null) {
            switchFragment(HomeFragment())
        }

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
