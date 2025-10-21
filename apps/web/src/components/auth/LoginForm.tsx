import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authService } from '@/services/auth.service'
import { toast } from 'sonner'
import { useAuthStore } from "@/lib/authStore" // 1. Trocamos o useAuth pelo nosso novo store do Zustand

const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
  password: z.string().min(1, { message: 'A senha não pode estar vazia.' }),
})

type LoginFormValues = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSuccess?: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  // Pegamos a função de login do nosso store, que serve para ATUALIZAR o estado
  const { login: setAuthState } = useAuthStore();

  async function onSubmit(values: LoginFormValues) {
    try {
      // A API agora retorna { accessToken, refreshToken, user: { id: '...', username: '...' } }
      const response = await authService.login(values);
      const { accessToken, user } = response; // Isso agora funciona!

      // O 'user' da API já tem 'id', mas nosso store espera 'userId'.
      // Então, o mapeamento ainda é necessário e correto.
      const userForStore = {
        userId: user.id,
        username: user.username,
      };

      setAuthState(userForStore, accessToken);

      console.log("✅ Login realizado com sucesso!");
      toast.success(`Bem-vindo de volta, ${user.username}!`);
      onSuccess?.();
    } catch (err: any) {
      console.error('Erro ao fazer login:', err);
      toast.error('Erro ao realizar login. Email ou senha incorretos.');
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          {...form.register('email')}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...form.register('password')}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={form.formState.isSubmitting} // Desabilita o botão durante o envio
      >
        {form.formState.isSubmitting ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  )
}