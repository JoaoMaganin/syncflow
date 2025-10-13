import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

// Importando nossos componentes
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  // Estado para controlar qual formulário mostrar: 'login' ou 'register'
  const [view, setView] = useState<'login' | 'register'>('login')

  return (
    <div className="p-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mt-10">Página Principal (Tarefas)</h1>
      <p className="mt-4 text-muted-foreground">
        A lista de tarefas aparecerá aqui quando o usuário estiver logado.
      </p>

      {/* O Modal de Autenticação */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="mt-8">Entrar ou Criar Conta</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-card" style={{
          backgroundColor: 'hsl(var(--card))',
          color: 'hsl(var(--card-foreground))',
          borderColor: 'hsl(var(--border))'
        }}>
          <DialogHeader>
            <DialogTitle>{view === 'login' ? 'Login' : 'Criar Conta'}</DialogTitle>
            <DialogDescription>
              {view === 'login' ? 'Acesse sua conta para ver suas tarefas.' : 'Crie uma conta para começar a se organizar.'}
            </DialogDescription>
          </DialogHeader>

          {/* Renderização condicional do formulário */}
          {view === 'login' ? <LoginForm /> : <RegisterForm />}

          <DialogFooter className="text-sm">
            {view === 'login' ? (
              <>
                Não tem uma conta?{' '}
                <Button variant="link" className="p-0 h-auto" onClick={() => setView('register')}>
                  Cadastre-se
                </Button>
              </>
            ) : (
              <>
                Já tem uma conta?{' '}
                <Button variant="link" className="p-0 h-auto" onClick={() => setView('login')}>
                  Faça login
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}