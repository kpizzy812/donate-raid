// frontend/src/components/ClientWrapper.tsx - ОБНОВЛЕННАЯ ВЕРСИЯ
'use client'

import { ThemeProvider } from '@/components/ThemeProvider'
import { CartProvider } from '@/context/CartContext'
import { Toaster } from 'sonner'
import Footer from '@/components/Footer'

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <CartProvider>
        <Toaster position="top-right" richColors />
        <div className="flex flex-col flex-1 min-h-screen">
          {/* Основной контент с отступом для мобильной навигации */}
          <main className="flex-1 pb-20 md:pb-0">
            {children}
          </main>
          {/* Footer теперь скрыт на мобилках, так как у нас есть мобильная навигация */}
          <div className="hidden md:block">
            <Footer />
          </div>
        </div>
      </CartProvider>
    </ThemeProvider>
  )
}