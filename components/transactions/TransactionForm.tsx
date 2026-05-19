'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import {
  Transaction,
  TransactionType,
  Category,
  CATEGORY_LABELS,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from '@/types'

interface TransactionFormProps {
  onSuccess: () => void
  transaction?: Transaction
}

export function TransactionForm({ onSuccess, transaction }: TransactionFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (transaction) return
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'n' || e.key === 'N') setOpen(true)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [transaction])
  const [type, setType] = useState<TransactionType>(transaction?.type || 'expense')
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '')
  const [description, setDescription] = useState(transaction?.description || '')
  const [category, setCategory] = useState<Category | ''>(transaction?.category || '')
  const [date, setDate] = useState(transaction?.date || new Date().toISOString().split('T')[0])

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!category) return toast.error('Selecione uma categoria')

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) return toast.error('Valor inválido')
    if (parsedAmount > 9_999_999) return toast.error('Valor muito alto')
    if (description.trim().length < 2) return toast.error('Descrição muito curta')

    setLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return toast.error('Sessão expirada, faça login novamente')

    const payload = {
      type,
      amount: parsedAmount,
      description: description.trim().slice(0, 200),
      category,
      date,
      user_id: user.id,
    }

    const { error } = transaction
      ? await supabase.from('transactions').update(payload).eq('id', transaction.id).eq('user_id', user.id)
      : await supabase.from('transactions').insert(payload)

    if (error) {
      toast.error('Não foi possível salvar a transação. Tente novamente.')
    } else {
      toast.success(transaction ? 'Transação atualizada!' : 'Transação adicionada!')
      setOpen(false)
      onSuccess()
    }

    setLoading(false)
  }

  return (
    <>
      {transaction ? (
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>Editar</Button>
      ) : (
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Nova transação
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{transaction ? 'Editar transação' : 'Nova transação'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={type === 'expense' ? 'default' : 'outline'}
              onClick={() => { setType('expense'); setCategory('') }}
              className={type === 'expense' ? 'bg-rose-600 hover:bg-rose-700' : ''}
            >
              Despesa
            </Button>
            <Button
              type="button"
              variant={type === 'income' ? 'default' : 'outline'}
              onClick={() => { setType('income'); setCategory('') }}
              className={type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              Receita
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Valor (R$)</Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input
              placeholder="Ex: Almoço, Salário..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </form>
      </DialogContent>
      </Dialog>
    </>
  )
}
