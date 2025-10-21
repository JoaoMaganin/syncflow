import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { LoginForm } from "@/components/auth/LoginForm"
import { RegisterForm } from "@/components/auth/RegisterForm"
import { useAuthStore } from "@/lib/authStore"
import { useNavigate } from "@tanstack/react-router"
import { Input } from "./ui/input"
import { Search } from "lucide-react"

export function Navbar() {
    const { user, logout } = useAuthStore()
    const [open, setOpen] = useState(false)
    const [view, setView] = useState<'login' | 'register'>('login')

    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Navega para a rota '/', atualizando os parâmetros de busca
        navigate({
            to: '/',
            search: {
                search: searchTerm, // Define o termo de busca
                page: 1, // Reseta para a página 1
                size: 10
            },
        })
    }

    return (
        <nav className="w-full flex justify-between items-center p-4 bg-stone-950 shadow-md">
            <div className="text-xl font-bold text-slate-50">SyncFlow</div>

            {user && ( // Só mostra a busca se o usuário estiver logado
                <form onSubmit={handleSearchSubmit} className="flex-grow max-w-md flex gap-2 text-slate-50">
                    <Input
                        placeholder="Buscar tarefas pelo título..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1" // Faz o input ocupar o espaço disponível
                    />
                    <Button type="submit" size="icon" variant="outline">
                        <Search className="w-4 h-4" />
                    </Button>
                </form>
            )}

            {/*  a condição agora é simplesmente "se o usuário existe" */}
            {user ? (
                // Se o usuário estiver logado, mostramos o nome dele e o botão de sair
                <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-300">Olá, {user.username}!</span>
                    <Button variant="destructive" className="text-slate-50" onClick={logout}>
                        Sair
                    </Button>
                </div>
            ) : (
                // Se o usuário não estiver logado, o modal de "Entrar" continua o mesmo
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="text-slate-50">Entrar</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] text-slate-50">
                        <DialogHeader>
                            <DialogTitle>{view === 'login' ? 'Login' : 'Criar Conta'}</DialogTitle>
                            <DialogDescription>
                                {view === 'login'
                                    ? 'Acesse sua conta para ver suas tarefas.'
                                    : 'Crie uma conta para começar a se organizar.'}
                            </DialogDescription>
                        </DialogHeader>

                        {view === 'login' ? (
                            <LoginForm onSuccess={() => setOpen(false)} />
                        ) : (
                            <RegisterForm onSuccess={() => setOpen(false)} />
                        )}

                        <DialogFooter className="text-sm">
                            {view === 'login' ? (
                                <>
                                    Não tem uma conta?{' '}
                                    <Button variant="link" className="p-0 h-auto" onClick={() => setView('register')}>
                                        Cadastre-se
                                    </Button>
                                </>
                            ) : (
                                <>
                                    Já tem uma conta?{' '}
                                    <Button variant="link" className="p-0 h-auto" onClick={() => setView('login')}>
                                        Faça login
                                    </Button>
                                </>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </nav>
    )
}