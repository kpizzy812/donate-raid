// frontend/src/components/ClientWrapper.tsx - ФИНАЛЬНАЯ ВЕРСИЯ
'use client'

import { ThemeProvider } from '@/components/ThemeProvider'
import { CartProvider } from '@/context/CartContext'
import { Toaster } from 'sonner'
import Footer from '@/components/Footer'
import GlobalChatProvider from '@/components/GlobalChatProvider'
import ContactButtons from '@/components/ContactButtons'

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <CartProvider>
        {/* Уведомления */}
        <Toaster position="top-right" richColors />

        {/* Основной контент */}
        <div className="flex flex-col flex-1 min-h-screen">
          <main className="flex-1 pb-20 md:pb-0">
            {children}
          </main>

          {/* Footer (скрыт на мобилке) */}
          <div className="hidden md:block">
            <Footer />
          </div>
        </div>

        {/* ГЛОБАЛЬНЫЕ КОМПОНЕНТЫ С ФИКСИРОВАННЫМ ПОЗИЦИОНИРОВАНИЕМ */}

        {/* Кнопки контактов (Telegram и др.) */}
        <ContactButtons />

        {/* Глобальный чат поддержки (поверх всего) */}
        <GlobalChatProvider />

      </CartProvider>
    </ThemeProvider>
  )
}