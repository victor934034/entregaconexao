package com.example.appdenetregasconexao2772.ui.pedidos

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import com.example.appdenetregasconexao2772.R
import java.util.*

class DaysAdapter(private val onDayClick: (Date) -> Unit) : RecyclerView.Adapter<DaysAdapter.DayViewHolder>() {

    private var days = listOf<Date>()
    private var selectedDate: Date = Date()

    fun submitDays(newDays: List<Date>, selected: Date) {
        days = newDays
        selectedDate = selected
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): DayViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_day, parent, false)
        return DayViewHolder(view)
    }

    override fun onBindViewHolder(holder: DayViewHolder, position: Int) {
        val date = days[position]
        holder.bind(date, selectedDate)
        holder.itemView.setOnClickListener {
            selectedDate = date
            notifyDataSetChanged()
            onDayClick(date)
        }
    }

    override fun getItemCount() = days.size

    class DayViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        private val tvDayName: TextView = view.findViewById(R.id.tvDayName)
        private val tvDayNumber: TextView = view.findViewById(R.id.tvDayNumber)
        private val indicator: View = view.findViewById(R.id.indicator)

        fun bind(date: Date, selected: Date) {
            val cal = Calendar.getInstance()
            cal.time = date
            
            val calSelected = Calendar.getInstance()
            calSelected.time = selected

            val isSelected = cal.get(Calendar.DAY_OF_YEAR) == calSelected.get(Calendar.DAY_OF_YEAR) &&
                            cal.get(Calendar.YEAR) == calSelected.get(Calendar.YEAR)

            tvDayNumber.text = cal.get(Calendar.DAY_OF_MONTH).toString()
            
            val dayName = when(cal.get(Calendar.DAY_OF_WEEK)) {
                Calendar.SUNDAY -> "Dom"
                Calendar.MONDAY -> "Seg"
                Calendar.TUESDAY -> "Ter"
                Calendar.WEDNESDAY -> "Qua"
                Calendar.THURSDAY -> "Qui"
                Calendar.FRIDAY -> "Sex"
                Calendar.SATURDAY -> "Sáb"
                else -> ""
            }
            tvDayName.text = dayName

            if (isSelected) {
                tvDayNumber.setTextColor(ContextCompat.getColor(itemView.context, R.color.primary))
                tvDayName.setTextColor(ContextCompat.getColor(itemView.context, R.color.primary))
                indicator.visibility = View.VISIBLE
            } else {
                tvDayNumber.setTextColor(ContextCompat.getColor(itemView.context, R.color.text_secondary))
                tvDayName.setTextColor(ContextCompat.getColor(itemView.context, R.color.text_tertiary))
                indicator.visibility = View.INVISIBLE
            }
        }
    }
}
