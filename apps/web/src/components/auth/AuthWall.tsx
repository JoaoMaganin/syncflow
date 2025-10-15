import { useAuthStore } from "@/lib/authStore";
import { type ReactNode } from "react";

interface AuthWallProps {
  children: ReactNode;
}

export function AuthWall({ children }: AuthWallProps) {
  const { user, openLoginModal } = useAuthStore();

  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    // Se o usuário já estiver logado, não faz nada e deixa o clique acontecer
    if (user) {
      return;
    }

    // Se o usuário NÃO estiver logado:
    e.stopPropagation(); // Impede que o evento de clique afete para outros elementos
    e.preventDefault(); // Impede a ação padrão do clique (ex: seguir um link)
    openLoginModal(); // Abre o nosso modal de login global
  };

  return (
    // o onClickCapture é um evento que dispara antes do onClick normal dos componentes filhos, nos permitindo "interceptar" a ação.
    <div onClickCapture={handleClickCapture}>
      {children}
    </div>
  );
}