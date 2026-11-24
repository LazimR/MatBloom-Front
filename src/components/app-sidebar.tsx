"use client"

import { BookOpen, FileQuestion, Users, LogOut, Home, ShieldCheck, Building2 } from "lucide-react"
import { User, CreditCard, Bell } from "lucide-react"
import Images from "@/assets/Images"
import { useRouter } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import { useAppDispatch, useAppSelector } from "@/hooks/Redux"
import { logout } from "@/services/request/Index"
import { clearUser } from "@/store/slices/User"

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
    roles: ["admin", "diretor", "professor"],
  },
  {
    title: "Turmas",
    url: "/turmas",
    icon: Building2,
    roles: ["admin", "diretor", "professor"],
  },
  {
    title: "Gerenciar Alunos",
    url: "/gerenciarEstudantes",
    icon: Users,
    roles: ["admin", "diretor", "professor"],
  },
  {
    title: "Gerenciar Questões",
    url: "/gerenciarQuestoes",
    icon: FileQuestion,
    roles: ["admin", "diretor", "professor"],
  },
  {
    title: "Provas",
    url: "/provas",
    icon: BookOpen,
    roles: ["admin", "diretor", "professor"],
  },
  {
    title: "Gerenciar Usuários",
    url: "/gerenciarUsuarios",
    icon: ShieldCheck,
    roles: ["admin", "diretor"],
  }
]

export function AppSidebar() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.user)
  const visibleItems = items.filter((item) => item.roles.includes(user.role))

  async function handleLogout() {
    await logout()
    dispatch(clearUser())
    router.replace("/login")
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">MATBLOOM</h1>
        <img src={Images.logo.src} className="w-10 h-10" alt="logo" />
        </div>

      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:text-black"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={Images.logo.src} alt={user.username || "Usuário"} />
                    <AvatarFallback className="rounded-lg bg-teal-100 text-teal-700">
                      {(user.username || "U").slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight hover:text-black">
                    <span className="truncate font-semibold">{user.username || "Usuário"}</span>
                    <span className="truncate text-xs ">{user.email || "Sessão ativa"}</span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Conta</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Assinatura</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell className="mr-2 h-4 w-4" />
                  <span>Notificações</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
