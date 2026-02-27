package com.example.appdenetregasconexao2772.ui.pedidos

import android.content.Context
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.appdenetregasconexao2772.databinding.FragmentCalendarioBinding
import com.example.appdenetregasconexao2772.model.Pedido
import com.example.appdenetregasconexao2772.ui.pedidos.PedidoDetalhesActivity
import com.google.android.material.datepicker.MaterialDatePicker
import java.text.SimpleDateFormat
import java.util.*

class CalendarioFragment : Fragment() {

    private var _binding: FragmentCalendarioBinding? = null
    private val binding get() = _binding!!

    private lateinit var viewModel: PedidosViewModel
    private lateinit var adapter: PedidosAdapter
    private lateinit var daysAdapter: DaysAdapter
    private val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    private val monthFormat = SimpleDateFormat("MMMM yyyy", Locale.getDefault())
    private var currentCalendar = Calendar.getInstance()
    private var selectedDate = Date()

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentCalendarioBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        viewModel = ViewModelProvider(this)[PedidosViewModel::class.java]

        setupRecyclerViews()
        setupCalendarNavigation()
        observeViewModel()

        updateDaysList()
        carregarConfiguracaoInicial()
    }

    private fun carregarConfiguracaoInicial() {
        val hoje = sdf.format(Date())
        updateSelectedDateLabel(Date())
        carregarPorData(hoje)
    }

    private fun setupRecyclerViews() {
        // RecyclerView de Pedidos
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
        binding.rvPedidosAgenda.layoutManager = LinearLayoutManager(requireContext())
        binding.rvPedidosAgenda.adapter = adapter

        // RecyclerView de Dias (Horizontal)
        daysAdapter = DaysAdapter { date ->
            selectedDate = date
            updateSelectedDateLabel(date)
            carregarPorData(sdf.format(date))
        }
        binding.rvDays.adapter = daysAdapter
    }

    private fun setupCalendarNavigation() {
        binding.btnPrevMonth.setOnClickListener {
            currentCalendar.add(Calendar.MONTH, -1)
            updateDaysList()
        }

        binding.btnNextMonth.setOnClickListener {
            currentCalendar.add(Calendar.MONTH, 1)
            updateDaysList()
        }

        binding.btnSearchDate.setOnClickListener {
            val datePicker = MaterialDatePicker.Builder.datePicker()
                .setTitleText("Selecionar Data")
                .setSelection(selectedDate.time)
                .build()

            datePicker.addOnPositiveButtonClickListener { selection ->
                val calendar = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
                calendar.timeInMillis = selection
                
                selectedDate = calendar.time
                currentCalendar.time = calendar.time
                
                updateDaysList()
                updateSelectedDateLabel(selectedDate)
                carregarPorData(sdf.format(selectedDate))
            }
            datePicker.show(childFragmentManager, "DATE_PICKER")
        }
    }

    private fun updateDaysList() {
        binding.tvCurrentMonth.text = monthFormat.format(currentCalendar.time).replaceFirstChar { it.uppercase() }
        
        val daysInMonth = mutableListOf<Date>()
        val tempCal = currentCalendar.clone() as Calendar
        tempCal.set(Calendar.DAY_OF_MONTH, 1)
        val maxDay = tempCal.getActualMaximum(Calendar.DAY_OF_MONTH)
        
        for (i in 1..maxDay) {
            tempCal.set(Calendar.DAY_OF_MONTH, i)
            daysInMonth.add(tempCal.time)
        }
        
        daysAdapter.submitDays(daysInMonth, selectedDate)
        
        // Scroll para o dia selecionado se estiver no mês atual
        val calSelected = Calendar.getInstance().apply { time = selectedDate }
        if (calSelected.get(Calendar.MONTH) == currentCalendar.get(Calendar.MONTH) &&
            calSelected.get(Calendar.YEAR) == currentCalendar.get(Calendar.YEAR)) {
            binding.rvDays.scrollToPosition(calSelected.get(Calendar.DAY_OF_MONTH) - 1)
        }
    }

    private fun updateSelectedDateLabel(date: Date) {
        val format = SimpleDateFormat("EEEE, d 'de' MMMM", Locale.getDefault())
        binding.tvSelectedDateLabel.text = "Pedidos para: ${format.format(date)}"
    }

    private fun observeViewModel() {
        viewModel.pedidos.observe(viewLifecycleOwner) { lista ->
            binding.progressBar.visibility = View.GONE
            adapter.submitList(lista)
            updateEmptyState(lista.isEmpty())
        }

        viewModel.error.observe(viewLifecycleOwner) { msg ->
            Toast.makeText(requireContext(), msg, Toast.LENGTH_SHORT).show()
            binding.progressBar.visibility = View.GONE
        }
        
        viewModel.statusUpdateSuccess.observe(viewLifecycleOwner) { success ->
            if (success) {
                carregarPorData(sdf.format(selectedDate))
            }
        }
    }

    private fun updateEmptyState(isEmpty: Boolean) {
        binding.layoutEmptyState.visibility = if (isEmpty) View.VISIBLE else View.GONE
        binding.rvPedidosAgenda.visibility = if (isEmpty) View.GONE else View.VISIBLE
    }

    private fun carregarPorData(data: String) {
        binding.progressBar.visibility = View.VISIBLE
        binding.layoutEmptyState.visibility = View.GONE
        val prefs = requireContext().getSharedPreferences("conexao_prefs", Context.MODE_PRIVATE)
        val uid = prefs.getInt("uid", -1)
        if (uid != -1) {
            viewModel.carregarPedidosPorData(uid, data)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
