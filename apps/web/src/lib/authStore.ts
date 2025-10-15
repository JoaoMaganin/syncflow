import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AuthState } from '../../../../packages/types/AuthTypes';
import { authService } from '@/services/auth.service';

// Define a "forma" do nosso estado de autenticação


// Cria o store com Zustand
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoginModalOpen: false,
      login: (user, token) => set({ user, token }),
      logout: () => {
        // Chame seu serviço para limpar o localStorage
        authService.logout();

        // Limpe o estado do Zustand
        set({ user: null, token: null });

        // Recarregue a página para garantir que todo o estado da aplicação seja resetado.
        window.location.reload();
      },
      openLoginModal: () => set({ isLoginModalOpen: true }),
      closeLoginModal: () => set({ isLoginModalOpen: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)