import { useState } from 'react'
import { createFileRoute, Link, useSearch } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { privateClient } from '@/services/base'
import { useAuthStore } from '@/lib/authStore'
import { AuthWall } from '@/components/auth/AuthWall'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger, } from '@/components/ui/dialog'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CreateTaskForm } from '@/components/tasks/CreateTaskForm'
import type { mockedTask, Task } from '../../../../packages/types/TaskTypes'
import { UpdateTaskForm } from '@/components/tasks/UpdateTaskForm'
import { toast } from 'sonner'
import { z } from 'zod'
import { TaskCardSkeleton } from '../components/tasks/TaskCardSkeleton'
import { TaskCard } from '@/components/tasks/TaskCard'
import mockTasks from '../../public/mockTasks.json';
import "../index.css";


const tasksSearchSchema = z.object({
  search: z.string().optional(),
  page: z.number().int().min(1).optional(),
  size: z.number().int().min(1).optional(),
})

export const Route = createFileRoute('/')({
  // Esta função valida e aplica os padrões da URL
  validateSearch: (search) => tasksSearchSchema.parse(search),
  component: HomePage,
})

function HomePage() {
  // Pegue o estado e as ações do modal do nosso store global
  const { isLoginModalOpen, closeLoginModal, user, token } = useAuthStore();
  const [view, setView] = useState<'login' | 'register'>('login');
  const [isCreateTaskOpen, setCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const queryClient = useQueryClient();
  // Pega os parâmetros da url
  const { search: urlSearch, page: urlPage, size: urlSize } = useSearch({ from: Route.id });

  const search = urlSearch || '';
  const page = urlPage || 1;
  const size = urlSize || 10;

  const fetchTasks = async (query: { search: string, page: number, size: number }) => {
    const params = new URLSearchParams({
      page: query.page.toString(), // Isso agora é seguro
      size: query.size.toString(), // Isso agora é seguro
    })
    if (query.search) {
      params.append('search', query.search)
    }

    // A API retorna o objeto { data: Task[], totalPages: number, ... }
    const response = await privateClient.get(`/tasks?${params.toString()}`)
    return response.data
  }

  const {
    data: queryResult,
    isLoading,
    isError
  } = useQuery({
    queryKey: ['tasks', search, page, size],
    queryFn: () => fetchTasks({ search, page, size }),
    enabled: !!token,
  })

  const tasks = queryResult?.data;
  const totalPages = queryResult?.totalPages ?? 1

  const renderContent = () => {
    if (!user) {
      return (
        <AuthWall>
          <div className="p-4 flex flex-col items-center">
            <p className="text-center text-muted-foreground mb-4">
            </p>
            {/* Aplicamos uma opacidade para dar a ideia de "desabilitado" */}
            <ul className="space-y-4 opacity-70">
              {/* Mapeamos o array 'mockTasks' importado */}
              {(mockTasks as mockedTask[]).map((task: any) => (
                // Usamos o mesmo JSX do seu 'if (tasks)', mas SEM os botões
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={(task) => setEditingTask(task)}
                  onDelete={(taskId) => deleteMutation.mutate(taskId)}
                />
              ))}
            </ul>
          </div>
        </AuthWall>
      )
    }

    if (isLoading) {
      return (
        <div className="mt-8 w-full max-w-2xl space-y-4 items-center">
          <TaskCardSkeleton />
          <TaskCardSkeleton />
          <TaskCardSkeleton />
        </div>
      )
    }

    if (isError) {
      return <p className="mt-4 text-destructive">Erro ao carregar as tarefas.</p>
    }

    if (!tasks || tasks.length === 0) {
      return <p className="mt-4 text-center">Você ainda não tem nenhuma tarefa.</p>
    }

    // ---------------------------
    // SE HOUVER PESQUISA: LISTA NORMAL
    // ---------------------------
    if (search && search.trim() !== '') {
      return (
        <div className="mt-8 w-full max-w-2xl">
          <ul className="space-y-4">
            {tasks.map((task: Task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={(task) => setEditingTask(task)}
                onDelete={(taskId) => deleteMutation.mutate(taskId)}
              />
            ))}

            {/* Paginação */}
            {tasks.length > 0 && search != '' && (
              <div className="mt-8 flex flex-wrap justify-center items-center gap-x-6 gap-y-4">

                {/* GRUPO 1: Controles de Página (só aparece se houver mais de 1 página) */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" asChild disabled={page <= 1}>
                      <Link to="/" search={{ search, size, page: page - 1 }}>
                        Anterior
                      </Link>
                    </Button>

                    <span className="text-sm text-muted-foreground">
                      Página {page} de {totalPages}
                    </span>

                    <Button variant="outline" asChild disabled={page >= totalPages}>
                      <Link to="/" search={{ search, size, page: page + 1 }}>
                        Próxima
                      </Link>
                    </Button>
                  </div>
                )}

                {/* GRUPO 2: Controles de Tamanho (usando Links) */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Itens por página:</span>

                  {/* Botão para 5 itens */}
                  <Button
                    variant={size === 5 ? 'default' : 'outline'}
                    size="sm"
                    asChild
                  >
                    <Link to="/" search={{ search, page: 1, size: 5 }}>5</Link>
                  </Button>

                  {/* Botão para 10 itens */}
                  <Button
                    variant={size === 10 ? 'default' : 'outline'}
                    size="sm"
                    asChild
                  >
                    <Link to="/" search={{ search, page: 1, size: 10 }}>10</Link>
                  </Button>

                  {/* Botão para 15 itens */}
                  <Button
                    variant={size === 15 ? 'default' : 'outline'}
                    size="sm"
                    asChild
                  >
                    <Link to="/" search={{ search, page: 1, size: 15 }}>15</Link>
                  </Button>
                </div>

              </div>
            )}
          </ul>


        </div>
      )
    }

    // ---------------------------
    // SE NÃO HOUVER PESQUISA: KANBAN POR STATUS
    // ---------------------------
    // Agrupa tarefas por status
    const groupedTasks = {
      todo: [] as Task[],
      in_progress: [] as Task[],
      review: [] as Task[],
      done: [] as Task[],
      unlisted: [] as Task[],
    }

    tasks.forEach((task: Task) => {
      const status = task.status?.toLowerCase()
      if (!status) groupedTasks.unlisted.push(task)
      else if (status === 'todo') groupedTasks.todo.push(task)
      else if (status === 'in_progress') groupedTasks.in_progress.push(task)
      else if (status === 'review') groupedTasks.review.push(task)
      else if (status === 'done') groupedTasks.done.push(task)
      else groupedTasks.unlisted.push(task)
    })

    const renderColumn = (title: string, taskList: Task[]) => (
      <div className="flex-1 min-w-[250px] border rounded-lg p-4 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-animated-light rounded-lg pointer-events-none" />
        <h2 className="text-xl font-semibold mb-4 text-center">{title}</h2>
        {taskList.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center relative z-10">Sem tarefas</p>
        ) : (
          <ul className="space-y-4 relative z-10">
            {taskList.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={(task) => setEditingTask(task)}
                onDelete={(taskId) => deleteMutation.mutate(taskId)}
              />
            ))}
          </ul>
        )}
      </div>
    )

    return (
      <div className="mt-8 w-full flex flex-wrap gap-4 justify-center items-start">
        {renderColumn('To Do', groupedTasks.todo)}
        {renderColumn('In Progress', groupedTasks.in_progress)}
        {renderColumn('Review', groupedTasks.review)}
        {renderColumn('Done', groupedTasks.done)}
      </div>
    )
  }


  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => {
      // Chama o endpoint DELETE
      return privateClient.delete(`/tasks/${taskId}`)
    },
    onSuccess: (data) => {
      // ATUALIZA A LISTA DE TAREFAS NA TELA
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success(`Tarefa deletada "${data.data.title}" com sucesso!`)
    },
    onError: (error) => {
      console.error('Erro ao deletar tarefa:', error)
      toast.error('Não foi possível deletar a tarefa.')
    },
  })

  return (
    <div className="p-4 flex flex-col">
      <div className="w-full max-w-7xl mx-auto flex justify-center items-center mb-4 mt-10 px-4 relative">
        <h1 className="text-3xl font-bold">Minhas tarefas</h1>

        {user && ( // Só mostra o botão se o usuário estiver logado
          <div className="absolute right-4">
            <Dialog open={isCreateTaskOpen} onOpenChange={setCreateTaskOpen}>
              <DialogTrigger asChild>
                <Button>Criar tarefa</Button>
              </DialogTrigger>
              <DialogContent className="text-slate-50">
                <DialogHeader>
                  <DialogTitle>Criar Nova Tarefa</DialogTitle>
                </DialogHeader>
                {/* RENDERIZA O FORMULÁRIO DENTRO DO MODAL */}
                <CreateTaskForm onSuccess={() => setCreateTaskOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {renderContent()}


      {/* --- ADICIONE O NOVO MODAL DE EDIÇÃO AQUI --- */}
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