'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { CATEGORY_LABELS, type Category, type TransactionFilters } from '@/types'

interface Props {
  filters: TransactionFilters
  onChange: (filters: TransactionFilters) => void
}

const TYPE_LABELS: Record<string, string> = {
  all: 'Todos',
  income: 'Receitas',
  expense: 'Despesas',
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
  const currentPeriod = filters.period || months[0].value
  const currentType = filters.type || 'all'
  const currentCategory = filters.category || 'all'

  const periodLabel = months.find((m) => m.value === currentPeriod)?.label || 'Período'
  const typeLabel = TYPE_LABELS[currentType]
  const categoryLabel = currentCategory === 'all' ? 'Todas categorias' : CATEGORY_LABELS[currentCategory as Category]

  return (
    <div className="flex flex-wrap gap-3">
      <Select
        value={currentPeriod}
        onValueChange={(v) => onChange({ ...filters, period: v })}
      >
        <SelectTrigger className="w-44">
          <span className="flex-1 text-left text-sm">{periodLabel}</span>
        </SelectTrigger>
        <SelectContent>
          {months.map((m) => (
            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentType}
        onValueChange={(v) => onChange({ ...filters, type: v as TransactionFilters['type'] })}
      >
        <SelectTrigger className="w-36">
          <span className="flex-1 text-left text-sm">{typeLabel}</span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="income">Receitas</SelectItem>
          <SelectItem value="expense">Despesas</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={currentCategory}
        onValueChange={(v) => onChange({ ...filters, category: v as Category | 'all' })}
      >
        <SelectTrigger className="w-44">
          <span className="flex-1 text-left text-sm">{categoryLabel}</span>
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
