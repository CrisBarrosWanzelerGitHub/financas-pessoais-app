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
  revista: 'lazer', revistas: 'lazer', livros: 'lazer',
  jogo: 'lazer', jogos: 'lazer', game: 'lazer',
  // outros
  sapateiro: 'outros', roupa: 'outros', sapato: 'outros',
  reparo: 'outros', conserto: 'outros', cabeleireiro: 'outros', barbearia: 'outros',
}

const INCOME_MAP: Record<string, Category> = {
  salario: 'salario',
  freelance: 'freelance', freela: 'freelance',
  projeto: 'freelance', projetos: 'freelance', servico: 'freelance', servicos: 'freelance',
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

  // Remove thousands separator (45.000 → 45000), then convert decimal comma
  const amountStr = amountMatch[1]
    .replace(/\.(\d{3})(?!\d)/g, '$1')
    .replace(',', '.')
  const amount = parseFloat(amountStr)
  if (isNaN(amount) || amount <= 0) return null

  const descRaw = segment
    .replace(amountMatch[0], '')
    .replace(/\breais\b|\breal\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
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
  // Split on commas or " e " conjunctions to handle both orderings:
  // "400 supermercado", "supermercado 400", "supermercado 400 e farmácia 50"
  const parts = text
    .split(/,\s*|\s+e\s+/i)
    .map((s) => s.trim())
    .filter(Boolean)

  return parts
    .map((s) => parseSegment(s))
    .filter((t): t is ParsedTransaction => t !== null)
}
