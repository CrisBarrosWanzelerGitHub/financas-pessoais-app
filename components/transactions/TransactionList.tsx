'use client'

import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Transaction, CATEGORY_LABELS } from '@/types'
import { TransactionForm } from './TransactionForm'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
}

interface TransactionListProps {
  transactions: Transaction[]
  onRefresh: () => void
}

export function TransactionList({ transactions, onRefresh }: TransactionListProps) {
  async function handleDelete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) {
      toast.error('Erro ao excluir transação')
    } else {
      toast.success('Transação excluída')
      onRefresh()
    }
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32 text-muted-foreground text-sm">
          Nenhuma transação encontrada
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {transactions.map((t) => (
        <Card key={t.id} className="hover:shadow-sm transition-shadow">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{t.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {CATEGORY_LABELS[t.category]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(t.date)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`font-semibold text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                </span>
                <TransactionForm transaction={t} onSuccess={onRefresh} />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-rose-600"
                  onClick={() => handleDelete(t.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
