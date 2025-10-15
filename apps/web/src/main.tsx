import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { Toaster } from "@/components/ui/sonner"

import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen' // Importa a árvore de rotas
import { Navbar } from './components/Navbar'

// Cria a instância do roteador
const router = createRouter({ routeTree })

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
        <Navbar />
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
    </React.StrictMode>,
  )
}