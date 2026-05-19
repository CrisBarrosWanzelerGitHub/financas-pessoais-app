import { Category, TransactionType } from '@/types'

export interface ParsedTransaction {
  type: TransactionType
  amount: number
  description: string
  category: Category
  date: string
}

const EXPENSE_MAP: Record<string, Category> = {
  // alimentacao
  mercado: 'alimentacao', supermercado: 'alimentacao', feira: 'alimentacao',
  restaurante: 'alimentacao', lanche: 'alimentacao', almoco: 'alimentacao',
  jantar: 'alimentacao', cafe: 'alimentacao', padaria: 'alimentacao',
  acougue: 'alimentacao', pizza: 'alimentacao', hamburguer: 'alimentacao',
  ifood: 'alimentacao', delivery: 'alimentacao', mercearia: 'alimentacao',
  hortifruti: 'alimentacao', quitanda: 'alimentacao', sorveteria: 'alimentacao',
  // transporte
  uber: 'transporte', onibus: 'transporte', metro: 'transporte',
  gasolina: 'transporte', estacionamento: 'transporte', pedagio: 'transporte',
  taxi: 'transporte', combustivel: 'transporte', mecanico: 'transporte',
  // moradia
  aluguel: 'moradia', condominio: 'moradia', agua: 'moradia',
  luz: 'moradia', energia: 'moradia', internet: 'moradia', gas: 'moradia',
  // saude
  medico: 'saude', farmacia: 'saude', remedio: 'saude',
  hospital: 'saude', dentista: 'saude', academia: 'saude',
  // educacao
  escola: 'educacao', faculdade: 'educacao', curso: 'educacao', livro: 'educacao',
  // lazer
  cinema: 'lazer', netflix: 'lazer', spotify: 'lazer',
  viagem: 'lazer', bar: 'lazer', show: 'lazer',
  // outros
  sapateiro: 'outros', roupa: 'outros', sapato: 'outros',
  reparo: 'outros', conserto: 'outros', cabeleireiro: 'outros', barbearia: 'outros',
}

const INCOME_MAP: Record<string, Category> = {
  salario: 'salario',
  freelance: 'freelance', freela: 'freelance',
  dividendo: 'investimentos', rendimento: 'investimentos', juros: 'investimentos',
}

function normalize(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function today() {
  return new Date().toISOString().split('T')[0]
}

function parseSegment(segment: string): ParsedTransaction | null {
  const amountMatch = segment.match(/(\d+(?:[.,]\d+)?)/)
  if (!amountMatch) return null

  const amount = parseFloat(amountMatch[1].replace(',', '.'))
  if (isNaN(amount) || amount <= 0) return null

  const descRaw = segment.replace(amountMatch[0], '').trim()
  const description = descRaw
    .replace(/^(na|no|de|do|da|em|para|pelo|pela|num|numa|o|a|os|as)\s+/i, '')
    .trim()

  if (!description) return null

  const norm = normalize(description)

  for (const [keyword, category] of Object.entries(INCOME_MAP)) {
    if (norm.includes(normalize(keyword))) {
      return { type: 'income', amount, description, category, date: today() }
    }
  }

  for (const [keyword, category] of Object.entries(EXPENSE_MAP)) {
    if (norm.includes(normalize(keyword))) {
      return { type: 'expense', amount, description, category, date: today() }
    }
  }

  return { type: 'expense', amount, description, category: 'outros', date: today() }
}

export function parseVoiceInput(text: string): ParsedTransaction[] {
  // "50 na feira, 20 no sapateiro e 30 na padaria"
  // Normalize "e {number}" to ", {number}" so we can split uniformly
  const normalized = text.replace(/\s+e\s+(?=\d)/gi, ', ')
  const segments = normalized.match(/\d+(?:[.,]\d+)?[^,]*/g) ?? [text]

  return segments
    .map((s) => parseSegment(s.trim()))
    .filter((t): t is ParsedTransaction => t !== null)
}
