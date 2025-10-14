import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="p-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold mt-10">Página Principal (Tarefas)</h1>
      <p className="mt-4 text-muted-foreground">
        A lista de tarefas aparecerá aqui quando o usuário estiver logado.
      </p>
    </div>
  )
}