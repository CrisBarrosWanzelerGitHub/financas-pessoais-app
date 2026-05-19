export type TransactionType = 'income' | 'expense'

export type Category =
  | 'alimentacao'
  | 'transporte'
  | 'moradia'
  | 'saude'
  | 'educacao'
  | 'lazer'
  | 'salario'
  | 'freelance'
  | 'investimentos'
  | 'outros'

export const CATEGORY_LABELS: Record<Category, string> = {
  alimentacao: 'Alimentação',
  transporte: 'Transporte',
  moradia: 'Moradia',
  saude: 'Saúde',
  educacao: 'Educação',
  lazer: 'Lazer',
  salario: 'Salário',
  freelance: 'Freelance',
  investimentos: 'Investimentos',
  outros: 'Outros',
}

export const EXPENSE_CATEGORIES: Category[] = [
  'alimentacao',
  'transporte',
  'moradia',
  'saude',
  'educacao',
  'lazer',
  'outros',
]

export const INCOME_CATEGORIES: Category[] = [
  'salario',
  'freelance',
  'investimentos',
  'outros',
]

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  description: string
  category: Category
  date: string
  created_at: string
}

export interface TransactionFilters {
  period?: string
  category?: Category | 'all'
  type?: TransactionType | 'all'
}

export interface MonthlySummary {
  totalIncome: number
  totalExpenses: number
  balance: number
}
