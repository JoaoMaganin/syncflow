import { Skeleton } from "@/components/ui/skeleton"

export function TaskCardSkeleton() {
  return (
    <div className="block p-4 border rounded-lg shadow-sm">
      {/* Esqueleto do Título e Botões */}
      <div className="flex justify-between items-start">
        <Skeleton className="h-6 w-3/4" /> {/* Esqueleto do Título */}
        <div className="flex gap-1">
          <Skeleton className="h-7 w-7 rounded-md" /> {/* Esqueleto do Botão Editar */}
          <Skeleton className="h-7 w-7 rounded-md" /> {/* Esqueleto do Botão Deletar */}
        </div>
      </div>

      {/* Esqueleto das Informações (Status e Comentários) */}
      <div className="flex justify-between items-center mt-4">
        <Skeleton className="h-5 w-1/4" /> {/* Esqueleto do Status */}
        <Skeleton className="h-5 w-16" /> {/* Esqueleto da Contagem de Comentários */}
      </div>
    </div>
  )
}