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
  // 2. PEGUE O TOKEN DO STORE
  const { token } = useAuthStore()
  const queryClient = useQueryClient()

  // 3. ESTE É O "CÉREBRO" DO NOSSO RÁDIO
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
    <div className="bg-background text-foreground min-h-screen flex flex-col">
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