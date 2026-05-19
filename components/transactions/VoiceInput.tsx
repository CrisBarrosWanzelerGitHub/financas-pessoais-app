'use client'

import { useState, useRef, useEffect } from 'react'
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
  const [interimText, setInterimText] = useState('')
  const [transcript, setTranscript] = useState('')
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([])
  const [saving, setSaving] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (!transcript) return
    setTransactions(parseVoiceInput(transcript))
  }, [transcript])

  function startRecording() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognitionClass) {
      toast.error('Seu navegador não suporta reconhecimento de voz')
      return
    }

    const recognition = new SpeechRecognitionClass()
    recognition.lang = 'pt-BR'
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }
      if (interim) setInterimText(interim)
      if (final) {
        setInterimText('')
        setTranscript(final.trim())
      }
    }

    recognition.onerror = () => {
      toast.error('Erro ao gravar. Tente novamente.')
      setRecording(false)
      setInterimText('')
    }

    recognition.onend = () => {
      setRecording(false)
      setInterimText('')
    }

    recognition.start()
    recognitionRef.current = recognition
    setRecording(true)
    setTranscript('')
  }

  function stopRecording() {
    recognitionRef.current?.stop()
    setRecording(false)
    setInterimText('')
  }

  function removeTransaction(index: number) {
    setTransactions((prev) => prev.filter((_, i) => i !== index))
  }

  function handleClose() {
    setTranscript('')
    setTransactions([])
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
      handleClose()
      onSuccess()
    }
    setSaving(false)
  }

  return (
    <>
      <div className="flex flex-col items-end gap-1">
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
        {(recording || interimText) && (
          <p className="text-xs text-muted-foreground max-w-48 text-right truncate">
            {interimText || 'ouvindo...'}
          </p>
        )}
      </div>

      <Dialog open={!!transcript} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar transações</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">O que você disse — edite se precisar:</p>
              <textarea
                className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                rows={2}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
              />
            </div>

            {transactions.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{transactions.length} transação{transactions.length > 1 ? 'ões' : ''} detectada{transactions.length > 1 ? 's' : ''}:</p>
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
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                Nenhuma transação detectada. Tente editar o texto acima.
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={saving || transactions.length === 0}
            >
              <Check className="h-4 w-4 mr-1" />
              {saving ? 'Salvando...' : `Salvar ${transactions.length}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
