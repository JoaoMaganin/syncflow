import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { privateClient } from '@/services/base'
import type { Task, Comment } from '../../../../../packages/types/TaskTypes'
import { CreateCommentForm } from '@/components/tasks/CreateCommentForm'

// A rota é inferida do nome do arquivo
export const Route = createFileRoute('/tasks/$taskId')({
    component: TaskDetailPage,
})

function TaskDetailPage() {
    // 1. Pegamos o 'taskId' da URL usando o hook do TanStack Router
    const { taskId } = Route.useParams()

    // --- Query 1: Buscar os dados da Tarefa ---
    const {
        data: task,
        isLoading: isTaskLoading,
        isError: isTaskError
    } = useQuery({
        queryKey: ['task', taskId],
        queryFn: async (): Promise<Task> => {
            const response = await privateClient.get(`/tasks/${taskId}`)
            return response.data
        },
    })

    // --- Query 2: Buscar os Comentários (ADICIONE ISTO) ---
    const {
        data: comments,
        isLoading: isCommentsLoading,
        isError: isCommentsError
    } = useQuery({
        // A chave é única para os comentários DESTA tarefa
        queryKey: ['comments', taskId],
        // A função de busca
        queryFn: async (): Promise<Comment[]> => {
            const response = await privateClient.get(`/tasks/${taskId}/comments`)
            return response.data
        },
        // Só executa esta query se a busca da tarefa principal (task) foi bem-sucedida
        enabled: !!task,
    })

    // Renderização condicional (Loading, Error, Success)
    if (isTaskLoading) {
        return (
            <div className="p-4">
                <h1 className="text-2xl font-bold">Carregando Tarefa...</h1>
                {/* TODO: Adicionar Skeleton Loader aqui */}
            </div>
        )
    }

    if (isTaskError) {
        return (
            <div className="p-4">
                <h1 className="text-2xl font-bold text-destructive">Erro</h1>
                <p>Não foi possível carregar a tarefa. Tente novamente.</p>
            </div>
        )
    }

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold">{task?.title}</h1>

            <p className="text-lg text-muted-foreground mt-2">
                Criado por: <span className="font-medium text-foreground">{task?.ownerUsername}</span>
            </p>

            <div className="flex gap-4 my-4 text-sm">
                <span className="p-1 px-2 rounded bg-muted text-muted-foreground capitalize">
                    {task?.status.toLowerCase().replace('_', ' ')}
                </span>
                <span className="p-1 px-2 rounded bg-muted text-muted-foreground capitalize">
                    Prioridade: {task?.priority.toLowerCase()}
                </span>
            </div>

            <p className="mt-4 text-lg text-muted-foreground">
                {task?.description || 'Nenhuma descrição fornecida.'}
            </p>

            <div className="mt-6">
                <h3 className="text-sm font-semibold uppercase text-muted-foreground">Atribuído a</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                    {/* Verifica se a lista de 'assignees' existe e não está vazia */}
                    {task?.assignees && task.assignees.length > 0 ? (
                        task.assignees.map(user => (
                            <div
                                key={user.id}
                                className="p-1 px-3 rounded-full bg-secondary text-secondary-foreground text-sm font-medium"
                            >
                                {user.username}
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">Ninguém</p>
                    )}
                </div>
            </div>

            <hr className="my-8" />

            <h2 className="text-2xl font-bold mb-4">Comentários</h2>

            {/* --- Formulário de comentário --- */}
            <div className="mb-6">
                <CreateCommentForm taskId={taskId} />
            </div>
            {/* --- Fim do formulário --- */}

            {/* --- Seção de comentários --- */}
            <div>

                {/* Mostra "Carregando..." enquanto busca os comentários */}
                {isCommentsLoading && (
                    <p className="text-muted-foreground">Carregando comentários...</p>
                )}

                {/* Mostra uma mensagem de erro se a busca de comentários falhar */}
                {isCommentsError && (
                    <p className="text-destructive">Erro ao carregar os comentários.</p>
                )}

                {/* Se a busca for bem-sucedida... */}
                {comments && (
                    <div className="space-y-4">
                        {comments.length === 0 && (
                            <p className="text-muted-foreground">Seja o primeiro a comentar!</p>
                        )}
                        {/* Se houver comentários, faz um .map() e exibe cada um */}
                        {comments.map((comment) => (
                            <div key={comment.id} className="p-4 border rounded-lg bg-muted/50">
                                <p className="text-sm">{comment.content}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    {/* Por enquanto, mostramos o ID. Mais tarde, podemos buscar o nome do usuário. */}
                                    Por: Usuário <span className="font-medium text-foreground">{comment.authorUsername}</span> em{' '}
                                    {new Date(comment.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {/* --- Fim da seção de comantários --- */}
        </div>
    )
}