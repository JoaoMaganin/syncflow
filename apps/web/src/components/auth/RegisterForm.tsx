import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { authService } from '@/services/auth.service'
import { useAuth } from "@/context/AuthContext"

const registerSchema = z.object({
  username: z.string().min(3, { message: "O nome de usuário deve ter pelo menos 3 caracteres." }),
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  password: z.string().min(8, { message: "A senha deve ter pelo menos 8 caracteres." }),
  confirmPassword: z.string().min(8, { message: "Confirme sua senha." }),
})
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"], // Aponta o erro no campo de confirmação
  })


type RegisterFormValues = z.infer<typeof registerSchema>

interface RegisterFormProps {
  onSuccess?: () => void // Fechar modal
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "" },
  })

  const { login } = useAuth()

  async function onSubmit(values: RegisterFormValues) {
    try {
      // Registrar usuário
      const { username, email, password } = values
      await authService.register({ username, email, password })
      toast.success("Conta criada com sucesso!")

      // Logar automaticamente
      await login(email, password);
      console.log('logado no sistema ao registar.');

      // Fechar o modal
      onSuccess?.()
    } catch (error: any) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Erro ao criar conta.')
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

      <Button type="submit" className="w-full">Criar Conta</Button>
    </form>
  )
}
