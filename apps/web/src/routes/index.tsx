import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { privateClient } from '@/services/base'
import { useAuthStore } from '@/lib/authStore'
import { AuthWall } from '@/components/auth/AuthWall' // 1. Importe o AuthWall
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, } from '@/components/ui/dialog'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  // 2. Pegue o estado e as ações do modal do nosso store global
  const { isLoginModalOpen, closeLoginModal, user } = useAuthStore()
  const [view, setView] = useState<'login' | 'register'>('login')

  // A sua função de teste continua a mesma
  const handleClick = async () => {
    try {
      const response = await privateClient.get('/auth/profile')
      console.log('✅ Resposta do /auth/profile:', response.data)
      alert('Sucesso! A rota protegida funcionou. Verifique o console.')
    } catch (err) {
      console.error('❌ Erro ao chamar /auth/profile:', err)
      alert('Falha! Verifique o console.')
    }
  }

  return (
    <div className="p-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mt-10">Página Principal (Tarefas)</h1>

      {user ? (
        <p className="mt-4 text-muted-foreground">
          Bem-vindo, {user.username}! A lista de tarefas aparecerá aqui.
        </p>
      ) : (
        <p className="mt-4 text-muted-foreground">
          Você pode ver o conteúdo, mas precisa fazer login para interagir.
        </p>
      )}

      {/* 3. Envolva o botão com o AuthWall */}
      <AuthWall>
        <Button className="mt-8" onClick={handleClick}>
          Testar Rota Protegida (/profile)
        </Button>
      </AuthWall>

      {/* 4. Adicione o Modal, controlado pelo Zustand */}
      <Dialog open={isLoginModalOpen} onOpenChange={closeLoginModal}>
        <DialogContent className="sm:max-w-[425px] text-slate-50">
          <DialogHeader>
            <DialogTitle>{view === 'login' ? 'Login' : 'Criar Conta'}</DialogTitle>
            <DialogDescription>
              {view === 'login'
                ? 'Acesse sua conta para continuar.'
                : 'Crie uma conta para começar.'}
            </DialogDescription>
          </DialogHeader>

          {/* Renderização condicional dos formulários */}
          {view === 'login' ? (
            <LoginForm onSuccess={closeLoginModal} />
          ) : (
            <RegisterForm onSuccess={closeLoginModal} />
          )}

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