'use client'

import { useState, useRef } from 'react'
import { Mic, MicOff, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { parseVoiceInput, ParsedTransaction } from '@/lib/voice-parser'
import { CATEGORY_LABELS } from '@/types'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

interface VoiceInputProps {
  onSuccess: () => void
}

export function VoiceInput({ onSuccess }: VoiceInputProps) {
  const [recording, setRecording] = useState(false)
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([])
  const [saving, setSaving] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  function startRecording() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognitionClass) {
      toast.error('Seu navegador não suporta reconhecimento de voz')
      return
    }

    const recognition = new SpeechRecognitionClass()
    recognition.lang = 'pt-BR'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript
      const parsed = parseVoiceInput(text)
      if (parsed.length === 0) {
        toast.error('Não entendi. Tente: "50 na feira, 30 na padaria"')
        return
      }
      setTransactions(parsed)
    }

    recognition.onerror = () => {
      toast.error('Erro ao gravar. Tente novamente.')
      setRecording(false)
    }

    recognition.onend = () => setRecording(false)

    recognition.start()
    recognitionRef.current = recognition
    setRecording(true)
  }

  function stopRecording() {
    recognitionRef.current?.stop()
    setRecording(false)
  }

  function removeTransaction(index: number) {
    setTransactions((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('Sessão expirada')
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('transactions')
      .insert(transactions.map((t) => ({ ...t, user_id: user.id })))

    if (error) {
      toast.error('Erro ao salvar transações')
    } else {
      toast.success(`${transactions.length} transação${transactions.length > 1 ? 'ões salvas' : ' salva'}!`)
      setTransactions([])
      onSuccess()
    }
    setSaving(false)
  }

  return (
    <>
      <Button
        variant={recording ? 'destructive' : 'outline'}
        size="sm"
        onClick={recording ? stopRecording : startRecording}
        className={recording ? 'animate-pulse' : ''}
      >
        {recording
          ? <MicOff className="h-4 w-4 mr-2" />
          : <Mic className="h-4 w-4 mr-2" />}
        {recording ? 'Parar' : 'Voz'}
      </Button>

      <Dialog open={transactions.length > 0} onOpenChange={() => setTransactions([])}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar transações</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 py-1">
            {transactions.map((t, i) => (
              <div key={i} className="flex items-start justify-between gap-3 p-3 rounded-lg border">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{capitalize(t.description)}</p>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {CATEGORY_LABELS[t.category]}
                  </Badge>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`font-semibold text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                  </span>
                  <button
                    className="text-xs text-muted-foreground hover:text-rose-600 transition-colors"
                    onClick={() => removeTransaction(i)}
                  >
                    remover
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => setTransactions([])}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving || transactions.length === 0}>
              <Check className="h-4 w-4 mr-1" />
              {saving ? 'Salvando...' : `Salvar ${transactions.length}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
