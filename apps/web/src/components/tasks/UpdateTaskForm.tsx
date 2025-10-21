import { useEffect } from 'react'
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
import { TaskPriority, TaskStatus, type Task } from '../../../../../packages/types/TaskTypes'
import { toast } from 'sonner'


const updateTaskSchema = z.object({
  title: z.string().min(3, { message: 'O título deve ter pelo menos 3 caracteres.' }).optional(),
  description: z.string().optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  assignees: z.string().optional(),
})

type UpdateTaskFormValues = z.infer<typeof updateTaskSchema>

interface UpdateTaskFormProps {
  task: Task; // A tarefa que estamos editando
  onSuccess?: () => void;
}

export function UpdateTaskForm({ task, onSuccess }: UpdateTaskFormProps) {
  const form = useForm<UpdateTaskFormValues>({
    resolver: zodResolver(updateTaskSchema),
  })

  // Efeito para preencher o formulário quando a tarefa (prop) mudar
  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        status: task.status,
        assignees: task.assignees.map(u => u.id).join(', '),
      });
    }
  }, [task, form]);

  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (updatedData: { assigneeIds?: string[] } & Omit<UpdateTaskFormValues, 'assignees'>) => {
      return privateClient.put<Task>(`/tasks/${task.id}`, updatedData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task', task.id] })
      onSuccess?.()
    },
    onError: (error) => {
      console.error('Erro ao atualizar tarefa:', error)
      toast.error('Não foi possível atualizar a tarefa.')
    },
  })

  function onSubmit(values: UpdateTaskFormValues) {
    mutation.mutate(values)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="title">Título da Tarefa</Label>
        <Input id="title" {...form.register('title')} />
        {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição (Opcional)</Label>
        <Textarea id="description" {...form.register('description')} />
      </div>

      <div className="flex gap-4">
        <div className="space-y-2 w-1/2">
          <Label htmlFor="status">Status</Label>
          {/* O 'key={task.status}' é um truque para forçar o Select a resetar quando o valor padrão mudar */}
          <Select key={task.status} onValueChange={(value) => form.setValue('status', value as TaskStatus)} defaultValue={task.status}>
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
          <Select key={task.priority} onValueChange={(value) => form.setValue('priority', value as TaskPriority)} defaultValue={task.priority}>
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
          placeholder="Cole os IDs dos usuários aqui..."
          {...form.register('assignees')}
        />
        <p className="text-xs text-muted-foreground">
          Deixe vazio para remover todos os atribuídos.
        </p>
      </div>

      <Button type="submit" className="w-full mt-4" disabled={mutation.isPending}>
        {mutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
      </Button>
    </form>
  )
}