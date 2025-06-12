// frontend/src/app/layout.tsx - ОБНОВЛЕННАЯ ВЕРСИЯ
import '@/styles/globals.css'
import { Inter } from 'next/font/google'
import { Metadata } from 'next'
import Header from '@/components/Header'
import ClientWrapper from '@/components/ClientWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DonateRaid',
  description: 'Платформа донатов и пополнений',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-white dark:bg-zinc-900 text-black dark:text-white`}>
        <ClientWrapper>
          <Header />
          {children}
        </ClientWrapper>
      </body>
    </html>
  )
}