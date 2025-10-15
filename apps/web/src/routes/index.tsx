import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { privateClient } from '@/services/base'
import { useAuthStore } from '@/lib/authStore'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { token } = useAuthStore()

  const handleClick = async () => {
    try {
      const response = await privateClient.get('/auth/profile')
      console.log('Resposta do /auth/profile:', response.data)
    } catch (err) {
      console.error('Erro ao chamar /auth/profile:', err)
    }
  }

  return (
    <div className="p-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mt-10">Página Principal (Tarefas)</h1>
      <p className="mt-4 text-muted-foreground">
        A lista de tarefas aparecerá aqui quando o usuário estiver logado.
      </p>
      {token && ( // Mostra o botão apenas se o usuário estiver logado
        <Button
          className="mt-8"
          onClick={handleClick}
        >
          Testar Rota Protegida (/profile)
        </Button>
      )}
    </div>
  )
}