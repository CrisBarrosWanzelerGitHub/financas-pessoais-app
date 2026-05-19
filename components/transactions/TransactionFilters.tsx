'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CATEGORY_LABELS, Category, TransactionFilters } from '@/types'

interface Props {
  filters: TransactionFilters
  onChange: (filters: TransactionFilters) => void
}

function getMonthOptions() {
  const options = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) })
  }
  return options
}

export function TransactionFilters({ filters, onChange }: Props) {
  const months = getMonthOptions()

  return (
    <div className="flex flex-wrap gap-3">
      <Select
        value={filters.period || months[0].value}
        onValueChange={(v) => onChange({ ...filters, period: v })}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          {months.map((m) => (
            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.type || 'all'}
        onValueChange={(v) => onChange({ ...filters, type: v as TransactionFilters['type'] })}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="income">Receitas</SelectItem>
          <SelectItem value="expense">Despesas</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.category || 'all'}
        onValueChange={(v) => onChange({ ...filters, category: v as Category | 'all' })}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas categorias</SelectItem>
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
            <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
