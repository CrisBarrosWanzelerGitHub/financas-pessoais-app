'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Transaction, TransactionType, CATEGORY_LABELS } from '@/types'

const COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

interface Props {
  transactions: Transaction[]
  type: TransactionType
}

const TITLES: Record<TransactionType, string> = {
  expense: 'Despesas por categoria',
  income: 'Receitas por categoria',
}

const EMPTY_MESSAGES: Record<TransactionType, string> = {
  expense: 'Nenhuma despesa registrada no período',
  income: 'Nenhuma receita registrada no período',
}

export function CategoryChart({ transactions, type }: Props) {
  const filtered = transactions.filter((t) => t.type === type)

  const data = Object.entries(
    filtered.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {} as Record<string, number>)
  ).map(([category, value]) => ({
    name: CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category,
    value,
  }))

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{TITLES[type]}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          {EMPTY_MESSAGES[type]}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{TITLES[type]}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
