import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { privateClient } from '@/services/base'
import { useAuthStore } from '@/lib/authStore'
//import { AuthWall } from '@/components/auth/AuthWall'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger, } from '@/components/ui/dialog'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageSquare } from 'lucide-react'
import { CreateTaskForm } from '@/components/tasks/CreateTaskForm'
import type { Task } from '../../../../packages/types/TaskTypes'
import { Pencil } from 'lucide-react';
import { UpdateTaskForm } from '@/components/tasks/UpdateTaskForm'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  // Pegue o estado e as ações do modal do nosso store global
  const { isLoginModalOpen, closeLoginModal, user, token } = useAuthStore();
  const [view, setView] = useState<'login' | 'register'>('login');
  const [isCreateTaskOpen, setCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const queryClient = useQueryClient();

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
                    <div className="flex justify-between items-center">
                      {/* LADO ESQUERDO */}
                      <div className="flex-1">
                        {/* Linha 1: título */}
                        <h3 className="font-semibold text-lg">{task.title}</h3>

                        {/* Linha 2: descrição */}
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {task.description}
                          </p>
                        )}

                        {/* Linha 3: status e prioridade */}
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                          <p>Status: {task.status.toLowerCase().replace("_", " ")}</p>
                          <p>Prioridade: {task.priority.toLowerCase().replace("_", " ")}</p>
                        </div>

                        {/* Linha 4: comentários + usuários */}
                        <div className="mt-3 flex items-center gap-3 text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-sm">{task.comments.length}</span>
                          </div>

                          {task.assignees && task.assignees.length > 0 && (
                            <div className="flex flex-wrap gap-2">
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
                        </div>
                      </div>

                      {/* LADO DIREITO - ÍCONES */}
                      <div className="flex flex-col items-center justify-center gap-2 ml-4">
                        {/* Botão de edição */}
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
                          <div className="bg-blue-500 p-2 rounded-md inline-flex items-center justify-center">
                            <Pencil className="w-4 h-4 text-white" />
                          </div>

                        </Button>

                        {/* Botão de deletar */}
                        <div
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                          }}
                        >
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                              >
                                <div className="bg-yellow-500 p-2 rounded-md inline-flex items-center justify-center">
                                  <Trash2 className="w-4 h-4" />
                                </div>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="text-slate-50">
                              <AlertDialogFooter className="flex flex-col items-center justify-center">
                                <AlertDialogTitle className="text-slate-50">
                                  Você tem certeza que deseja deletar a tarefa "{task.title}"?
                                </AlertDialogTitle>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-900 hover:bg-destructive/90 text-slate-50"
                                  onClick={() => deleteMutation.mutate(task.id)}
                                >
                                  Sim, deletar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
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

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => {
      // Chama o endpoint DELETE
      return privateClient.delete(`/tasks/${taskId}`)
    },
    onSuccess: (data, taskId) => {
      // 3. ATUALIZA A LISTA DE TAREFAS NA TELA
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success(`Tarefa deletada com sucesso!`)
    },
    onError: (error) => {
      console.error('Erro ao deletar tarefa:', error)
      toast.error('Não foi possível deletar a tarefa.')
    },
  })

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