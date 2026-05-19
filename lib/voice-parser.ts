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
  venda: 'outros', vendas: 'outros', vendi: 'outros',
}

function normalize(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

const NUMBER_WORDS: Record<string, number> = {
  um: 1, uma: 1,
  dois: 2, duas: 2,
  três: 3, tres: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  sete: 7,
  oito: 8,
  nove: 9,
  dez: 10,
  onze: 11,
  doze: 12,
  treze: 13,
  quatorze: 14, catorze: 14,
  quinze: 15,
  dezesseis: 16,
  dezessete: 17,
  dezoito: 18,
  dezenove: 19,
  vinte: 20,
  trinta: 30,
  quarenta: 40,
  cinquenta: 50,
  sessenta: 60,
  setenta: 70,
  oitenta: 80,
  noventa: 90,
  cem: 100, cento: 100,
  duzentos: 200, duzentas: 200,
  trezentos: 300, trezentas: 300,
  quatrocentos: 400,
  quinhentos: 500,
  seiscentos: 600,
  setecentos: 700,
  oitocentos: 800,
  novecentos: 900,
  mil: 1000,
}

function expandNumberWords(text: string): string {
  // Sort longest first so "quinhentos" matches before "cem" etc.
  const sorted = Object.keys(NUMBER_WORDS).sort((a, b) => b.length - a.length)
  let result = text
  for (const word of sorted) {
    result = result.replace(new RegExp(`\\b${word}\\b`, 'gi'), String(NUMBER_WORDS[word]))
  }
  return result
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
    .replace(/\b(paguei|gastei|transferi|mandei|enviei|pago|gasto)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  const description = descRaw
    .replace(/^(na|no|de|do|da|em|para|pelo|pela|num|numa|o|a|os|as)\s+/i, '')
    .replace(/\bpara\b\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!description) return null

  const norm = normalize(description)
  const segNorm = normalize(segment)
  const hasPara = /\bpara\b/.test(segNorm)
  // "venda/vendi/vendas" sempre é receita, mesmo que "para" apareça
  const hasVenda = /\bvend[aios]\b/.test(segNorm)

  if (hasVenda) {
    return { type: 'income', amount, description, category: 'outros', date: today() }
  }

  // "para" sinaliza que é pagamento a alguém → despesa (pula checagem de receita)
  if (!hasPara) {
    for (const [keyword, category] of Object.entries(INCOME_MAP)) {
      if (norm.includes(normalize(keyword))) {
        return { type: 'income', amount, description, category, date: today() }
      }
    }
  }

  for (const [keyword, category] of Object.entries(EXPENSE_MAP)) {
    if (norm.includes(normalize(keyword))) {
      return { type: 'expense', amount, description, category, date: today() }
    }
  }

  return { type: 'expense', amount, description, category: 'outros', date: today() }
}

function splitSegment(segment: string): string[] {
  const numbers = segment.match(/\d+(?:[.,]\d+)?/g) ?? []
  if (numbers.length <= 1) return [segment]

  // Segment starts with text: "Feira 90 sapateiro 50 mercado 1000"
  // Split into description-first chunks: each word group + its number
  if (/^[a-zA-ZÀ-úÇç]/.test(segment)) {
    const parts = segment.match(/[a-zA-ZÀ-úÇç][^0-9,]*\d+(?:[.,]\d+)?/g)
    if (parts && parts.length > 1) return parts
  }

  // Segment starts with a number: "90 na feira 50 no sapateiro"
  // Fall back to number-first splitting
  return segment.match(/\d+(?:[.,]\d+)?[^,\d]*/g) ?? [segment]
}

export function parseVoiceInput(text: string): ParsedTransaction[] {
  return expandNumberWords(text)
    .split(/,\s*|\s+e\s+/i)
    .map((s) => s.trim())
    .filter(Boolean)
    .flatMap(splitSegment)
    .map((s) => parseSegment(s))
    .filter((t): t is ParsedTransaction => t !== null)
}
