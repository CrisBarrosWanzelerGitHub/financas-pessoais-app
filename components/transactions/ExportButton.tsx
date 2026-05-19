'use client'

import { Button } from '@/components/ui/button'
import { Download, Share2 } from 'lucide-react'
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

function buildCsv(transactions: Transaction[]) {
  const headers = ['Data', 'Descrição', 'Tipo', 'Categoria', 'Valor (R$)']
  const rows = transactions.map((t) => [
    formatDate(t.date),
    `"${t.description.replace(/"/g, '""')}"`,
    t.type === 'income' ? 'Receita' : 'Despesa',
    CATEGORY_LABELS[t.category],
    formatAmount(t.amount),
  ])
  return [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
}

export function ExportButton({ transactions, period }: ExportButtonProps) {
  const filename = `transacoes${period ? `-${period}` : ''}.csv`
  const canNativeShare = typeof navigator !== 'undefined' && 'share' in navigator && 'canShare' in navigator

  async function handleExport() {
    const bom = '﻿'
    const csv = bom + buildCsv(transactions)

    if (canNativeShare) {
      const file = new File([csv], filename, { type: 'text/csv;charset=utf-8;' })
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'Transações' })
          return
        } catch (e) {
          if ((e as Error).name === 'AbortError') return
        }
      }
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
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
      {canNativeShare
        ? <Share2 className="h-4 w-4 mr-2" />
        : <Download className="h-4 w-4 mr-2" />}
      {canNativeShare ? 'Compartilhar' : 'Exportar CSV'}
    </Button>
  )
}
