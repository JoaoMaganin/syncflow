import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Navbar } from '@/components/Navbar'
import { useEffect } from 'react'
import { socket } from '@/lib/socket'
import { useAuthStore } from '@/lib/authStore'
import { Toaster, toast } from 'sonner'
import type { Task } from '../../../../packages/types/TaskTypes'
import { useQueryClient } from '@tanstack/react-query'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  // PEGUE O TOKEN DO STORE
  const { token } = useAuthStore()
  const queryClient = useQueryClient()

  // ESTE É O "CÉREBRO"
  useEffect(() => {
    // Se o usuário está logado (tem um token)
    if (token) {
      // Liga o rádio
      socket.connect()
      console.log('Conectando ao WebSocket...');

      // Sintoniza na estação 'new_task'
      socket.on('new_task', (data: Task) => {
        console.log('Recebido evento [new_task]:', data)
        toast.success(`Nova Tarefa Criada: "${data.title}"`)

        queryClient.invalidateQueries({ queryKey: ['tasks'] })
      });

      // Sintoniza na estação 'task_updated_event'
      socket.on('task_updated_event', (data: Task) => {
        console.log('Recebido evento [task_updated_event]:', data);
        toast.info(`Tarefa Atualizada: "${data.title}"`);

        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        // (Também invalide a query do detalhe, se estiver nela)
        queryClient.invalidateQueries({ queryKey: ['task', data.id] });
      });

      // Sintoniza na estação 'new_comment'
      socket.on('new_comment', (data: any) => {
        console.log('Recebido evento [new_comment]:', data)

        // Mostra um toast informando sobre o novo comentário
        toast.info(
          `Novo comentário de "${data.authorUsername}" na tarefa: "${data.task.title}"`
        );

        // Isso fará a lista de comentários na página de detalhes recarregar
        queryClient.invalidateQueries({ queryKey: ['comments', data.task.id] });

        // Invalida a query da tarefa (para atualizar a contagem de comentários)
        queryClient.invalidateQueries({ queryKey: ['task', data.task.id] });

        // Invalida a query da lista de tarefas (para atualizar a contagem na home)
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      });

      // Sintoniza no evento de conexão
      socket.on('connect', () => {
        console.log('✅ Conectado ao WebSocket:', socket.id);
      });

    } else {
      // Se o usuário deslogou, desliga o rádio
      socket.disconnect()
      console.log('🔌 Desconectado do WebSocket.');
    }

    // Função de "limpeza": desliga o rádio se o componente for destruído
    return () => {
      socket.off('new_task');
      socket.off('task_updated_event');
      socket.off('connect');
      socket.disconnect();
    }
  }, [token]) // Este 'useEffect' roda toda vez que o 'token' muda

  return (
    <div className="relative text-foreground min-h-screen flex flex-col bg-slate-950">

      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-green-500 rounded-full 
                      mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"
        ></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full 
                      mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-1000"
        ></div>
      </div>
      
      <Navbar />
      <main className="flex-grow container mx-auto">
        <Outlet />
      </main>

      {/* O Toaster é o container onde as notificações do 'sonner' vão aparecer */}
      <Toaster position="top-right" richColors />

      
      <TanStackRouterDevtools />
      <ReactQueryDevtools initialIsOpen={false} />
    </div>
  )
}