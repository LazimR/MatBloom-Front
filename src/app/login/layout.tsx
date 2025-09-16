import type { Metadata } from 'next'
import { Providers } from '@/store/Providers'
import '../globals.css'

export const metadata: Metadata = {
  title: 'MatBloom',
  description: 'Sistema de gerenciamento educacional',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
