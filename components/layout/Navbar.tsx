'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, TrendingUp, User, Smile, Star, Sun, Moon } from 'lucide-react'
import { toast } from 'sonner'

const AVATAR_OPTIONS = [
  { id: 'user', icon: User, label: 'Clássico' },
  { id: 'smile', icon: Smile, label: 'Sorridente' },
  { id: 'star', icon: Star, label: 'Estrela' },
]

export function Navbar({ email }: { email: string }) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [avatarId, setAvatarId] = useState('user')

  useEffect(() => {
    const saved = localStorage.getItem('avatar')
    if (saved) setAvatarId(saved)
  }, [])

  function selectAvatar(id: string) {
    setAvatarId(id)
    localStorage.setItem('avatar', id)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Saiu com sucesso')
    router.push('/login')
    router.refresh()
  }

  const AvatarIcon = AVATAR_OPTIONS.find((a) => a.id === avatarId)?.icon || User

  return (
    <header className="border-b bg-background">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Finanças Pessoais
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:block">{email}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 rounded-full p-0"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center hover:bg-primary/20 transition-colors outline-none cursor-pointer">
              <AvatarIcon className="h-4 w-4 text-primary" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <p className="px-2 py-1.5 text-xs text-muted-foreground">Escolha seu avatar</p>
              <DropdownMenuSeparator />
              {AVATAR_OPTIONS.map(({ id, icon: Icon, label }) => (
                <DropdownMenuItem
                  key={id}
                  onClick={() => selectAvatar(id)}
                  className={avatarId === id ? 'bg-accent' : ''}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-rose-600 focus:text-rose-600">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
