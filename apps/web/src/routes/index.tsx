import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { privateClient } from '@/services/base'
import { useAuthStore } from '@/lib/authStore'
//import { AuthWall } from '@/components/auth/AuthWall'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger, } from '@/components/ui/dialog'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { useQuery } from '@tanstack/react-query'
import { MessageSquare } from 'lucide-react'
import { CreateTaskForm } from '@/components/tasks/CreateTaskForm'
import type { Task } from '../../../../packages/types/TaskTypes'
import { Pencil } from 'lucide-react'; // 1. O ícone de lápis
import { UpdateTaskForm } from '@/components/tasks/UpdateTaskForm'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  // Pegue o estado e as ações do modal do nosso store global
  const { isLoginModalOpen, closeLoginModal, user, token } = useAuthStore();
  const [view, setView] = useState<'login' | 'register'>('login');
  const [isCreateTaskOpen, setCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null)

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
                    {/* Linha 1: título + botão de edição */}
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-lg">{task.title}</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setEditingTask(task)
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Linha 2: descrição */}
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {task.description}
                      </p>
                    )}

                    {/* Linha 3: status e prioridade */}
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                      <p>Status: {task.status.toLowerCase().replace('_', ' ')}</p>
                      <p>Prioridade: {task.priority.toLowerCase().replace('_', ' ')}</p>
                    </div>

                    {/* Linha 4: usuários atribuídos */}
                    {task.assignees && task.assignees.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {task.assignees.map((user) => (
                          <span
                            key={user.id}
                            className="text-xs bg-muted px-2 py-1 rounded-md"
                          >
                            {user.username}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Linha 5: comentários */}
                    <div className="mt-3 flex items-center gap-1 text-muted-foreground">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-sm">{task.comments.length}</span>
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

      {user && ( // Só mostra o botão se o usuário estiver logado
        <Dialog open={isCreateTaskOpen} onOpenChange={setCreateTaskOpen}>
          <DialogTrigger asChild>
            <Button>Criar Tarefa</Button>
          </DialogTrigger>
          <DialogContent className="text-slate-50">
            <DialogHeader>
              <DialogTitle>Criar Nova Tarefa</DialogTitle>
            </DialogHeader>
            {/* 4. RENDERIZA O FORMULÁRIO DENTRO DO MODAL */}
            <CreateTaskForm onSuccess={() => setCreateTaskOpen(false)} />
          </DialogContent>
        </Dialog>
      )}

      {renderContent()}

      {/* Envolva o botão com o AuthWall */}
      {/* <AuthWall>
        <Button className="mt-8" onClick={handleClick}>
          Testar Rota Protegida (/profile)
        </Button>
      </AuthWall> */}

      {/* --- 6. ADICIONE O NOVO MODAL DE EDIÇÃO AQUI --- */}
      <Dialog
        open={!!editingTask} // O modal abre se 'editingTask' não for nulo
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setEditingTask(null) // Fecha o modal e limpa o estado
          }
        }}
      >
        <DialogContent className="text-slate-50">
          <DialogHeader>
            <DialogTitle>Editar Tarefa</DialogTitle>
          </DialogHeader>
          {/* Se a tarefa existir, renderiza o formulário e passa a tarefa para ele */}
          {editingTask && (
            <UpdateTaskForm
              task={editingTask}
              onSuccess={() => setEditingTask(null)} // Fecha o modal em caso de sucesso
            />
          )}
        </DialogContent>
      </Dialog>
      {/* --- FIM DO MODAL DE EDIÇÃO --- */}

      {/* Adicione o Modal, controlado pelo Zustand */}
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