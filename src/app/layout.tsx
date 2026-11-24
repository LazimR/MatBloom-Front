import "./globals.css"

import type { Metadata } from "next"
import { Providers } from "@/store/Providers"
import { AppShell } from "@/components/app-shell"

export const metadata: Metadata = {
  title: "Matbloom",
  description: "Sistema de gerenciamento educacional",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  )
}
