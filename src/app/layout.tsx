import "./globals.css"

import { Providers } from "@/store/Providers"
import { AppShell } from "@/components/app-shell"

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
