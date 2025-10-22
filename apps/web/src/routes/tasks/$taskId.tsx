import { createFileRoute, Link, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { privateClient } from '@/services/base'
import type { Task, Comment } from '../../../../../packages/types/TaskTypes'
import { CreateCommentForm } from '@/components/tasks/CreateCommentForm'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import './taskId.css';

const commentsSearchSchema = z.object({
    commentPage: z.number().int().min(1).optional(),
    commentSize: z.number().int().min(1).optional(),
})

export const Route = createFileRoute('/tasks/$taskId')({
    validateSearch: (search) => commentsSearchSchema.parse(search),
    component: TaskDetailPage,
})

const priorityShadowMap: Record<string, string> = {
    low: 'inset 0px 0px 50px 0px rgba(0,255,0,0.38)',
    medium: 'inset 0px 0px 50px 0px rgba(255,253,10,0.38)',
    high: 'inset 0px 0px 50px 0px rgba(255,0,0,0.4)',
    urgent: 'inset 0px 0px 50px 0px rgba(67, 2, 128, 1)',
}

const greenAnimation: () => string = () => {
    return `font-bold bg-gradient-to-r from-slate-50 via-green-400 to-slate-50
                            bg-clip-text text-transparent
                            [background-size:200%_auto]
                            animate-[shimmer_6s_linear_infinite]`
}

function TaskDetailPage() {
    const { taskId } = Route.useParams()
    const { commentPage: urlCommentPage, commentSize: urlCommentSize } = useSearch({ from: Route.id })

    const commentPage = urlCommentPage || 1
    const commentSize = urlCommentSize || 5

    // --- Query 1: Buscar Tarefa ---
    const {
        data: task,
        isLoading: isTaskLoading,
        isError: isTaskError,
    } = useQuery({
        queryKey: ['task', taskId],
        queryFn: async (): Promise<Task> => {
            const response = await privateClient.get(`/tasks/${taskId}`)
            return response.data
        },
    })

    // --- Query 2: Buscar Comentários ---
    const {
        data: commentsResult,
        isLoading: isCommentsLoading,
        isError: isCommentsError,
    } = useQuery({
        queryKey: ['comments', taskId, commentPage, commentSize],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: commentPage.toString(),
                size: commentSize.toString(),
            })
            const response = await privateClient.get(`/tasks/${taskId}/comments?${params.toString()}`)
            return response.data as { data: Comment[]; totalPages: number }
        },
        enabled: !!task,
    })

    const comments = commentsResult?.data ?? []
    const totalCommentPages = commentsResult?.totalPages ?? 1

    if (isTaskLoading) {
        return (
            <div className="p-6">
                <Skeleton className="h-8 w-48 mb-4" />
                <Skeleton className="h-4 w-72 mb-2" />
                <Skeleton className="h-32 w-full" />
            </div>
        )
    }

    if (isTaskError) {
        return (
            <div className="p-6 text-center">
                <h1 className="text-2xl font-bold text-destructive">Erro ao carregar</h1>
                <p className="text-muted-foreground">Não foi possível carregar a tarefa. Tente novamente.</p>
            </div>
        )
    }

    return (
        <div className="relative min-h-screen p-6 text-4xl">

            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                {/* --- Cabeçalho da Tarefa --- */}
                <Card className="border border-muted bg-background/60 backdrop-blur-md"
                    style={{
                        boxShadow: priorityShadowMap[task?.priority?.toLowerCase() || ''] || 'none',
                    }}
                >
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-center">{task?.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mt-3 text-base">
                            {task?.description || 'Nenhuma descrição fornecida.'}
                        </p>

                        <p className="text-sm text-muted-foreground mb-2">
                            Criado por: <span className="font-medium text-foreground">{task?.ownerUsername}</span>
                        </p>

                        <div className="flex gap-4 my-3 text-sm">
                            <span className="p-1 px-2 rounded bg-muted text-muted-foreground capitalize">
                                <b>Status:</b> {task?.status.toLowerCase().replace('_', ' ')}
                            </span>
                            <span className="p-1 px-2 rounded bg-muted text-muted-foreground capitalize">
                                <b>Prioridade:</b> {task?.priority.toLowerCase()}
                            </span>
                        </div>

                        <div className="mt-5">
                            <h3 className="text-xs font-semibold uppercase text-muted-foreground">Atribuído a:</h3>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {task?.assignees && task.assignees.length > 0 ? (
                                    task.assignees.map((user) => (
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
                    </CardContent>
                </Card>

                {/* --- Seção de Comentários --- */}
                <Card className="border border-muted bg-background/60 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className={greenAnimation()}>
                            Comentários
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CreateCommentForm taskId={taskId} />

                        {isCommentsLoading ? (
                            <p className="text-muted-foreground mt-4">Carregando comentários...</p>
                        ) : isCommentsError ? (
                            <p className="text-destructive mt-4">Erro ao carregar os comentários.</p>
                        ) : comments.length === 0 ? (
                            <p className="text-xl text-muted-foreground mt-4">Seja o primeiro a comentar!</p>
                        ) : (
                            <div className="space-y-4 mt-4">
                                {comments.map((comment) => (
                                    <div
                                        key={comment.id}
                                        className="p-4 border border-muted-foreground/10 rounded-lg bg-muted/40"
                                    >
                                        <p className="text-sm">{comment.content}</p>
                                        <p className="text-xs text-muted-foreground mt-2 font-bold">
                                            Comentado por <span className="font-medium text-green-400">{comment.authorUsername}</span> em{' '}
                                            {new Date(comment.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Paginação */}
                        {comments.length > 0 && (
                            <div className="mt-6 flex flex-wrap justify-between items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" asChild disabled={commentPage <= 1}>
                                        <Link search={(prev) => ({ ...prev, commentPage: (prev.commentPage || 1) - 1 })}>
                                            Anterior
                                        </Link>
                                    </Button>
                                    <span className="text-sm text-muted-foreground">
                                        Página {commentPage} de {totalCommentPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        asChild
                                        disabled={commentPage >= totalCommentPages}
                                    >
                                        <Link search={(prev) => ({ ...prev, commentPage: (prev.commentPage || 1) + 1 })}>
                                            Próxima
                                        </Link>
                                    </Button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Itens por página:</span>
                                    {[5, 10, 15].map((size) => (
                                        <Button
                                            key={size}
                                            variant={commentSize === size ? 'default' : 'outline'}
                                            size="sm"
                                            asChild
                                        >
                                            <Link search={(prev) => ({ ...prev, commentPage: 1, commentSize: size })}>
                                                {size}
                                            </Link>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* --- Card de hisórico --- */}
                <Card className="border border-muted bg-background/60 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className={`text-2xl font-bold flex items-center gap-2 ${greenAnimation()}`}>
                            Histórico de Alterações
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {task?.history && task.history.length > 0 ? (
                            <ul className="space-y-4">
                                {task.history.map((log) => (
                                    <li key={log.id} className="text-sm text-muted-foreground">
                                        <span className="font-medium text-foreground">{log.username}</span>
                                        {' '}
                                        {/* Lógica para formatar a mensagem */}
                                        {log.action === 'TASK_CREATED' && `criou a tarefa: "${log.newValue}".`}
                                        {log.action === 'STATUS_CHANGED' && `mudou o status de "${log.oldValue}" para "${log.newValue}".`}
                                        {log.action === 'PRIORITY_CHANGED' && `mudou a prioridade de "${log.oldValue}" para "${log.newValue}".`}
                                        {log.action === 'ASSIGNEE_ADDED' && `atribuiu "${log.newValue}".`}
                                        {log.action === 'ASSIGNEE_REMOVED' && `removeu a atribuição de "${log.oldValue}".`}

                                        <span className="block text-xs mt-1">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">Nenhuma alteração registrada ainda.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default TaskDetailPage
