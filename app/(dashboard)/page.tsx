'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { ExpenseChart } from '@/components/dashboard/ExpenseChart'
import { TransactionList } from '@/components/transactions/TransactionList'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { TransactionFilters } from '@/components/transactions/TransactionFilters'
import { Transaction, TransactionFilters as Filters, MonthlySummary } from '@/types'

function getCurrentPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filters, setFilters] = useState<Filters>({ period: getCurrentPeriod(), type: 'all', category: 'all' })
  const [loading, setLoading] = useState(true)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const [year, month] = (filters.period || getCurrentPeriod()).split('-')
    const startDate = `${year}-${month}-01`
    const endDate = new Date(Number(year), Number(month), 0).toISOString().split('T')[0]

    let query = supabase
      .from('transactions')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })

    if (filters.type && filters.type !== 'all') query = query.eq('type', filters.type)
    if (filters.category && filters.category !== 'all') query = query.eq('category', filters.category)

    const { data } = await query
    setTransactions(data || [])
    setLoading(false)
  }, [filters])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  const allForPeriod = transactions
  const summary: MonthlySummary = {
    totalIncome: allForPeriod.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    totalExpenses: allForPeriod.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    balance: 0,
  }
  summary.balance = summary.totalIncome - summary.totalExpenses

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <TransactionForm onSuccess={fetchTransactions} />
      </div>

      <SummaryCards summary={summary} />

      <ExpenseChart transactions={transactions} />

      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-semibold">Transações</h2>
          <TransactionFilters filters={filters} onChange={setFilters} />
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : (
          <TransactionList transactions={transactions} onRefresh={fetchTransactions} />
        )}
      </div>
    </div>
  )
}
