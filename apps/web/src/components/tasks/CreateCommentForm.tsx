import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { privateClient } from '@/services/base'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'


const commentSchema = z.object({
    content: z.string().min(1, { message: 'O comentário não pode estar vazio.' }),
})

type CommentFormValues = z.infer<typeof commentSchema>

interface CreateCommentFormProps {
    taskId: string;
}

export function CreateCommentForm({ taskId }: CreateCommentFormProps) {
    const form = useForm<CommentFormValues>({
        resolver: zodResolver(commentSchema),
        defaultValues: { content: '' },
    })

    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: (newComment: CommentFormValues) => {
            return privateClient.post(`/tasks/${taskId}/comments`, newComment)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', taskId] })
            queryClient.invalidateQueries({ queryKey: ['task', taskId] })

            form.reset() // Limpa o formulário
        },
        onError: (error) => {
            console.error('Erro ao criar comentário:', error)
            toast.error('Não foi possível adicionar o comentário.')
        },
    })

    function onSubmit(values: CommentFormValues) {
        mutation.mutate(values)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Adicionar Comentário</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Digite seu comentário aqui..."
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? 'Enviando...' : 'Enviar Comentário'}
                </Button>
            </form>
        </Form>
    )
}