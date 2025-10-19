import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { Toaster } from "@/components/ui/sonner"

import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen' // Importa a árvore de rotas
import { Navbar } from './components/Navbar'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Cria a instância do roteador
const router = createRouter({ routeTree })

// Cria instância de cliente
const queryClient = new QueryClient();

// Declara os tipos para o roteador
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <Navbar />
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </React.StrictMode>,
  )
}