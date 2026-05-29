"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { getSession } from "@/services/request/Index"
import { useAppDispatch } from "@/hooks/Redux"
import { clearUser, setUser } from "@/store/slices/User"

const SIDEBAR_HIDDEN_ROUTES = new Set(["/", "/login"])
const PUBLIC_ROUTES = new Set(["/", "/login"])
const HOME_ROUTE = "/dashboard"
const LOGIN_ROUTE = "/login"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function syncSession() {
      const sessionResponse = await getSession()
      const isAuthenticated = sessionResponse.statusCode === 200 && "user" in sessionResponse.responseBody
      const isPublicRoute = PUBLIC_ROUTES.has(pathname)

      if (!isMounted) {
        return
      }

      if (isAuthenticated) {
        const session = sessionResponse.responseBody
        dispatch(
          setUser({
            id: session.user.id,
            username: session.user.username,
            email: session.user.email,
            role: session.user.role,
            classes: session.user.classes,
          })
        )
      } else {
        dispatch(clearUser())
      }

      if (pathname === "/") {
        router.replace(isAuthenticated ? HOME_ROUTE : LOGIN_ROUTE)
        return
      }

      if (!isAuthenticated && !isPublicRoute) {
        router.replace(LOGIN_ROUTE)
        return
      }

      if (isAuthenticated && pathname === LOGIN_ROUTE) {
        router.replace(HOME_ROUTE)
        return
      }

      setIsReady(true)
    }

    syncSession()

    return () => {
      isMounted = false
    }
  }, [dispatch, pathname, router])

  useEffect(() => {
    setIsReady(false)
  }, [pathname])

  if (!isReady) {
    return <main className="min-h-screen bg-background" />
  }

  if (SIDEBAR_HIDDEN_ROUTES.has(pathname)) {
    return <main className="min-h-screen">{children}</main>
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="min-h-screen w-full bg-muted/30">
        <div className="border-b bg-background/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger />
        </div>
        {children}
      </main>
    </SidebarProvider>
  )
}
