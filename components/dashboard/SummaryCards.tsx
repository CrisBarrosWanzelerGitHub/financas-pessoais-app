import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react'
import { MonthlySummary } from '@/types'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function SummaryCards({ summary }: { summary: MonthlySummary }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Receitas</CardTitle>
          <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(summary.totalIncome)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Despesas</CardTitle>
          <ArrowDownCircle className="h-4 w-4 text-rose-500" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-rose-600">{formatCurrency(summary.totalExpenses)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Saldo</CardTitle>
          <Wallet className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
            {formatCurrency(summary.balance)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
