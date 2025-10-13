import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div className="p-4 flex flex-col justify-center items-center flex-grow">
      <h1 className="text-3xl font-bold">Página de Login</h1>
      <h1 className="">Página de Login</h1>
    </div>
  )
}