import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/lib/authStore' // 1. Trocamos o useAuth pelo nosso store

const registerSchema = z.object({
  username: z.string().min(3, { message: "O nome de usuário deve ter pelo menos 3 caracteres." }),
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  password: z.string().min(8, { message: "A senha deve ter pelo menos 8 caracteres." }),
  confirmPassword: z.string().min(8, { message: "Confirme sua senha." }),
})
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

interface RegisterFormProps {
  onSuccess?: () => void
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "", confirmPassword: "" },
  })

  // 2. Pegamos a função de login do nosso store, que serve para ATUALIZAR o estado
  const { login: setAuthState } = useAuthStore()

  async function onSubmit(values: RegisterFormValues) {
    try {
      // Passo 1: Registrar o novo usuário
      const { username, email, password } = values
      await authService.register({ username, email, password })
      toast.success("Conta criada com sucesso! Fazendo login...")

      // Passo 2: Logar o usuário automaticamente com as mesmas credenciais
      const loginResponse = await authService.login({ email, password });
      const { accessToken, user } = loginResponse;
      
      // Passo 3: Mapear os dados para o formato do nosso store
      const userForStore = {
        userId: user.id,
        username: user.username,
      };

      // Passo 4: Atualizar o estado global, o que vai atualizar a Navbar
      setAuthState(userForStore, accessToken);
      console.log('Logado no sistema ao registrar.');
      
      // Passo 5: Chamar a função de sucesso para fechar o modal
      onSuccess?.()
    } catch (error: any) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Erro ao criar conta.')
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* O JSX do formulário continua o mesmo... */}
      <div className="space-y-2">
        <Label htmlFor="username">Nome de Usuário</Label>
        <Input id="username" placeholder="seu-usuario" {...form.register('username')} />
        {form.formState.errors.username && (
          <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="seu@email.com" {...form.register("email")} />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input id="password" type="password" placeholder="Digite sua senha" {...form.register('password')} />
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar Senha</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirme sua senha"
          {...form.register("confirmPassword")}
        />
        {form.formState.errors.confirmPassword && (
          <p className="text-sm text-destructive">
            {form.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>
      <Button 
        type="submit" 
        className="w-full"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? 'Criando...' : 'Criar Conta'}
      </Button>
    </form>
  )
}