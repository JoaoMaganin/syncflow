import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { MessageSquare, Pencil, Trash2 } from 'lucide-react'
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog"
import type { Task } from '../../../../../packages/types/TaskTypes'

interface TaskCardProps {
    task: Task
    onEdit: (task: Task) => void
    onDelete: (taskId: string) => void
}

const priorityShadowMap: Record<string, string> = {
    low: 'inset 0px 0px 50px 0px rgba(0,255,0,0.38)',
    medium: 'inset 0px 0px 50px 0px rgba(255,253,10,0.38)',
    high: 'inset 0px 0px 50px 0px rgba(255,0,0,0.4)',
    urgent: 'inset 0px 0px 50px 0px rgba(67, 2, 128, 1)',
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
    return (
        <li key={task.id}>
            <Link
                to="/tasks/$taskId"
                params={{ taskId: task.id }}
                className="block p-4 border rounded-lg shadow-sm hover:bg-muted/50 transition-colors"
                style={{
                    boxShadow: priorityShadowMap[task.priority?.toLowerCase() || ''] || 'none',
                }}
            >
                <div className="flex justify-between items-center">
                    {/* LADO ESQUERDO */}
                    <div className="flex-1">
                        <div className="flex items-center justify-center">
                            <h3 className="font-semibold text-lg">{task.title}</h3>
                        </div>

                        {task.description && (
                            <div className="flex items-center justify-center">
                                <p className="text-sm text-muted-foreground mt-1">
                                    {task.description}
                                </p>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                            <p><b>Status:</b> {task.status?.toLowerCase().replace("_", " ") || 'Não listado'}</p>
                            <p><b>Prioridade:</b> {task.priority?.toLowerCase().replace("_", " ") || '—'}</p>
                        </div>

                        <div className="mt-3 flex items-center gap-3 text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <MessageSquare className="w-4 h-4" />
                                <span className="text-sm">{task.comments.length}</span>
                            </div>
                        </div>

                        <div className="mt-3 flex items-center gap-3 text-muted-foreground">
                            {task.assignees && task.assignees.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    Participantes: 
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
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                onEdit(task)
                            }}
                        >
                            <div className="bg-blue-500 p-2 rounded-md inline-flex items-center justify-center">
                                <Pencil className="w-4 h-4 text-white" />
                            </div>
                        </Button>

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
                                            onClick={() => onDelete(task.id)}
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
    )
}
