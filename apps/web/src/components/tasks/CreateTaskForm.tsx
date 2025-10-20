import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { privateClient } from '@/services/base'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { TaskPriority, TaskStatus, type Task } from '../../../../../packages/types/TaskTypes'


const createTaskSchema = z.object({
  title: z.string().min(3, { message: 'O título deve ter pelo menos 3 caracteres.' }),
  description: z.string().optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  assignees: z.string().optional(),
})

type CreateTaskFormValues = z.infer<typeof createTaskSchema>

interface CreateTaskFormProps {
  onSuccess?: () => void // Função para fechar o modal
}

export function CreateTaskForm({ onSuccess }: CreateTaskFormProps) {
  // Configuração do react-hook-form
  const form = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.TODO,
    },
  })

  // Configuração do TanStack Query para "Mutação" (Criação)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    // 2. A mutation agora enviará 'assigneeIds' (um array)
    mutationFn: (newTask: { title: string; description?: string; priority?: TaskPriority; status?: TaskStatus; assigneeIds?: string[] }) => {
      return privateClient.post<Task>('/tasks', newTask)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success(`Tarefa "${data.data.title}" criada com sucesso!`)
      onSuccess?.()
    },
    onError: (error) => {
      console.error('Erro ao criar tarefa:', error)
      toast.error('Não foi possível criar a tarefa.')
    },
  })

  // Função de envio
  function onSubmit(values: CreateTaskFormValues) {
    // Converte a string de IDs separados por vírgula em um array de IDs "limpos"
    const assigneeIds = values.assignees
      ? values.assignees.split(',').map(id => id.trim()).filter(id => id.length > 0)
      : [];

    // Remove o campo 'assignees' (string) e adiciona 'assigneeIds' (array)
    const { assignees, ...taskData } = values;

    mutation.mutate({
      ...taskData,
      assigneeIds,
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título da Tarefa</Label>
        <Input id="title" placeholder="Ex: Corrigir bug na home" {...form.register('title')} />
        {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição (Opcional)</Label>
        <Textarea id="description" placeholder="Descreva a tarefa..." {...form.register('description')} />
      </div>

      <div className="flex gap-4">
        <div className="space-y-2 w-1/2">
          <Label htmlFor="status">Status</Label>
          <Select onValueChange={(value) => form.setValue('status', value as TaskStatus)} defaultValue={TaskStatus.TODO}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent className="text-slate-50">
              {Object.values(TaskStatus).map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 w-1/2">
          <Label htmlFor="priority">Prioridade</Label>
          <Select onValueChange={(value) => form.setValue('priority', value as TaskPriority)} defaultValue={TaskPriority.MEDIUM}>
            <SelectTrigger id="priority">
              <SelectValue placeholder="Selecione a prioridade" />
            </SelectTrigger>
            <SelectContent className="text-slate-50">
              {Object.values(TaskPriority).map(priority => (
                <SelectItem key={priority} value={priority}>{priority}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="assignees">Atribuir Usuários (IDs separados por vírgula)</Label>
        <Textarea
          id="assignees"
          placeholder="Cole os IDs dos usuários aqui, separados por vírgula..."
          {...form.register('assignees')}
        />
        <p className="text-xs text-muted-foreground">
          Você pode pegar o ID de um usuário no perfil dele (funcionalidade futura).
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? 'Salvando...' : 'Salvar Tarefa'}
      </Button>
    </form>
  )
}