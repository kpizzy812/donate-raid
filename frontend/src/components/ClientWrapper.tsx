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
          {children}
          <Footer />
        </div>
      </CartProvider>
    </ThemeProvider>
  )
}
