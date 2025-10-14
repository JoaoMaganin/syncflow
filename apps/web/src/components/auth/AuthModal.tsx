import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LoginForm } from "./LoginForm"
import { RegisterForm } from "./RegisterForm"

interface AuthModalProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    children?: React.ReactNode
}

export function AuthModal({ open: controlledOpen, onOpenChange }: AuthModalProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [view, setView] = useState<"login" | "register">("login")

    // se os props open/onOpenChange forem passados, o modal fica controlado
    const open = controlledOpen ?? internalOpen
    const setOpen = onOpenChange ?? setInternalOpen

    return (
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
    )
}
