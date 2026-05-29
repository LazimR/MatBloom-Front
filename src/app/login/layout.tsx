import type { Metadata } from 'next'
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
  return children
}
