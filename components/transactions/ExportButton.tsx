'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { Transaction, CATEGORY_LABELS } from '@/types'

interface ExportButtonProps {
  transactions: Transaction[]
  period?: string | null
}

function formatDate(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
}

function formatAmount(amount: number) {
  return amount.toFixed(2).replace('.', ',')
}

export function ExportButton({ transactions, period }: ExportButtonProps) {
  function handleExport() {
    const headers = ['Data', 'Descrição', 'Tipo', 'Categoria', 'Valor (R$)']

    const rows = transactions.map((t) => [
      formatDate(t.date),
      `"${t.description.replace(/"/g, '""')}"`,
      t.type === 'income' ? 'Receita' : 'Despesa',
      CATEGORY_LABELS[t.category],
      formatAmount(t.amount),
    ])

    const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
    const bom = '﻿'
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `transacoes${period ? `-${period}` : ''}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={transactions.length === 0}
    >
      <Download className="h-4 w-4 mr-2" />
      Exportar CSV
    </Button>
  )
}
