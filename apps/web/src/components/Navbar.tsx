import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { LoginForm } from "@/components/auth/LoginForm"
import { RegisterForm } from "@/components/auth/RegisterForm"
import { useAuth } from "@/context/AuthContext"

export function Navbar() {
    const { isLoggedIn, logout } = useAuth()
    const [open, setOpen] = useState(false)
    const [view, setView] = useState<'login' | 'register'>('login')

    return (
        <nav className="w-full flex justify-between items-center p-4 bg-stone-950 shadow-md">
            <div className="text-xl font-bold text-slate-50">SyncFlow</div>

            {isLoggedIn ? (
                <Button variant="destructive"  className="text-slate-50" onClick={logout}>
                    Logout
                </Button>
            ) : (
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