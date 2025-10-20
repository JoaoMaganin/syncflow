import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { privateClient } from '@/services/base'
import { useAuthStore } from '@/lib/authStore'
//import { AuthWall } from '@/components/auth/AuthWall'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, } from '@/components/ui/dialog'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { useQuery } from '@tanstack/react-query'
import { MessageSquare } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: HomePage,
})

export const TaskStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  REVIEW: 'REVIEW',
  DONE: 'DONE',
} as const;

export const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  ownerId: string;
  ownerUsername: string;
  createdAt: string;
  updatedAt: string;
  assignees: { id: string, username: string }[];
  comments: { id: string }[];
}

function HomePage() {
  // Pegue o estado e as ações do modal do nosso store global
  const { isLoginModalOpen, closeLoginModal, user, token } = useAuthStore()
  const [view, setView] = useState<'login' | 'register'>('login')

  const fetchTasks = async (): Promise<Task[]> => {
    const response = await privateClient.get('/tasks')
    return response.data
  }

  const { data: tasks, isLoading, isError } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
    enabled: !!token,
  })

  const renderContent = () => {
    // Se o usuário não estiver logado
    if (!user) {
      return (
        <p className="mt-4 text-muted-foreground">
          Você pode ver o conteúdo, mas precisa fazer login para interagir.
        </p>
      )
    }

    // Se estiver logado e carregando
    if (isLoading) {
      return <p className="mt-4 text-muted-foreground">Carregando tarefas...</p>
      // TODO: Substituir por um Skeleton Loader
    }

    // Se estiver logado e der erro
    if (isError) {
      return <p className="mt-4 text-destructive">Erro ao carregar as tarefas.</p>
    }

    // Se estiver logado e tiver dados
    if (tasks) {
      return (
        <div className="mt-8 w-full max-w-2xl">
          {tasks.length === 0 ? (
            <p>Você ainda não tem nenhuma tarefa.</p>
          ) : (
            <ul className="space-y-4">
              {tasks.map((task) => (
                <li key={task.id}>
                  <Link
                    to="/tasks/$taskId"
                    params={{ taskId: task.id }}
                    className="block p-4 border rounded-lg shadow-sm hover:bg-muted/50 transition-colors"
                  >
                    {/* O conteúdo é o mesmo de antes */}
                    <h3 className="font-semibold text-lg">{task.title}</h3>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-sm text-muted-foreground capitalize">
                        {task.status.toLowerCase().replace('_', ' ')}
                      </p>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-sm">{task.comments.length}</span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <div className="p-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mt-10">Página Principal (Tarefas)</h1>

      {renderContent()}

      {/* 3. Envolva o botão com o AuthWall */}
      {/* <AuthWall>
        <Button className="mt-8" onClick={handleClick}>
          Testar Rota Protegida (/profile)
        </Button>
      </AuthWall> */}

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