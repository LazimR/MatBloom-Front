"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Building2, GraduationCap, ShieldCheck, Users } from "lucide-react"

import { useAppSelector } from "@/hooks/Redux"
import { get } from "@/services/request/Index"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type DashboardStudent = {
  id: number
  name: string
}

type DashboardClassroom = {
  id: number
  name: string
  school_year: number
  grade_level: string
  shift: string
  active: boolean
  teacher_ids: number[]
  teachers: {
    id: number
    username: string
    email: string
  }[]
  students: DashboardStudent[]
}

type DashboardUser = {
  id: number
  username: string
  email: string
  role: string
  classes: DashboardClassroom[]
}

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  diretor: "Diretor",
  professor: "Professor",
}

const shiftLabels: Record<string, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
  matutino_vespertino: "Matutino/Vespertino",
  integral: "Integral",
}

export function DashboardHome() {
  const user = useAppSelector((state) => state.user)

  const [classrooms, setClassrooms] = useState<DashboardClassroom[]>([])
  const [users, setUsers] = useState<DashboardUser[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    let isMounted = true

    async function loadDashboardData() {
      setIsLoading(true)
      setErrorMessage("")

      const classroomResponse = await get<DashboardClassroom[]>("/classroom/")

      let nextUsers: DashboardUser[] = []
      if (user.role === "admin") {
        const usersResponse = await get<DashboardUser[]>("/user/")
        if (usersResponse.statusCode === 200 && Array.isArray(usersResponse.responseBody)) {
          nextUsers = usersResponse.responseBody
        }
      }

      if (!isMounted) {
        return
      }

      if (classroomResponse.statusCode !== 200 || !Array.isArray(classroomResponse.responseBody)) {
        setClassrooms([])
        setUsers(nextUsers)
        setErrorMessage(
          "error" in classroomResponse.responseBody
            ? classroomResponse.responseBody.error
            : "Não foi possível carregar os dados da home."
        )
        setIsLoading(false)
        return
      }

      setClassrooms(classroomResponse.responseBody)
      setUsers(nextUsers)
      setIsLoading(false)
    }

    loadDashboardData()

    return () => {
      isMounted = false
    }
  }, [user.role])

  const filteredClassrooms = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) {
      return classrooms
    }

    return classrooms.filter((classroom) =>
      `${classroom.name} ${classroom.grade_level} ${classroom.school_year}`
        .toLowerCase()
        .includes(normalizedSearch)
    )
  }, [classrooms, searchTerm])

  const classroomCount = classrooms.length
  const studentCount = classrooms.reduce((total, classroom) => total + classroom.students.length, 0)
  const directorCount = users.filter((dashboardUser) => dashboardUser.role === "diretor").length
  const teacherCount = users.filter((dashboardUser) => dashboardUser.role === "professor").length

  return (
    <div className="min-h-screen bg-muted/30">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8">
        <section className="space-y-4">
          <Card className="border-border/70">
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-3xl tracking-tight">
                    Home do {roleLabels[user.role] || "usuário"}
                  </CardTitle>
                  <CardDescription className="mt-2 max-w-2xl text-base">
                    {user.role === "professor" &&
                      "Você visualiza apenas as turmas vinculadas ao seu usuário e os dados acadêmicos associados a esse escopo."}
                    {user.role === "diretor" &&
                      "Você visualiza todas as turmas da instituição e os professores vinculados a cada uma delas."}
                    {user.role === "admin" &&
                      "Você visualiza todas as turmas e todos os usuários. A criação de diretores fica disponível em uma rota administrativa separada."}
                  </CardDescription>
                </div>
                <div className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-800">
                  {user.email || "Sessão ativa"}
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
              <CardDescription>Métricas iniciais com os dados disponíveis neste papel.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={Building2}
                label="Turmas visíveis"
                value={String(classroomCount)}
                helper={user.role === "professor" ? "Escopo do professor" : "Instituição inteira"}
              />
              <MetricCard
                icon={GraduationCap}
                label="Alunos visíveis"
                value={String(studentCount)}
                helper="Total somado pelas turmas listadas"
              />
              {user.role === "admin" ? (
                <>
                  <MetricCard
                    icon={ShieldCheck}
                    label="Diretores"
                    value={String(directorCount)}
                    helper="Usuários com papel diretor"
                  />
                  <MetricCard
                    icon={Users}
                    label="Professores"
                    value={String(teacherCount)}
                    helper="Usuários com papel professor"
                  />
                </>
              ) : null}
            </CardContent>
          </Card>
        </section>

        {errorMessage ? (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="pt-6 text-sm text-destructive">{errorMessage}</CardContent>
          </Card>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <Card className="border-border/70">
            <CardHeader className="gap-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Turmas</CardTitle>
                  <CardDescription>
                    {user.role === "professor"
                      ? "Lista filtrada automaticamente para as suas turmas."
                      : "Lista completa das turmas disponíveis para este papel."}
                  </CardDescription>
                </div>
                <div className="w-full md:w-72">
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Buscar turma por nome, ano ou série"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Carregando turmas...</p>
              ) : filteredClassrooms.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma turma encontrada.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredClassrooms.map((classroom) => (
                    <Link key={classroom.id} href={`/turmas/${classroom.id}`} className="block">
                      <Card className="border-border/60 bg-background shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-xl hover:text-teal-700">{classroom.name}</CardTitle>
                          <CardDescription>
                            {classroom.grade_level} • {classroom.school_year} • {shiftLabels[classroom.shift] || classroom.shift}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            {classroom.students.length} aluno{classroom.students.length === 1 ? "" : "s"}
                          </div>
                          {(user.role === "diretor" || user.role === "admin") && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                              {classroom.teachers.length > 0
                                ? `Professor${classroom.teachers.length === 1 ? "" : "es"}: ${classroom.teachers.map((teacher) => teacher.username).join(", ")}`
                                : "Nenhum professor vinculado"}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <StatusBadge active={classroom.active} />
                            {user.role !== "professor" ? (
                              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                                Visão institucional
                              </span>
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
          </div>
        </section>
      </main>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: typeof Building2
  label: string
  value: string
  helper: string
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className="rounded-full bg-teal-50 p-2 text-teal-700">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{helper}</p>
    </div>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium",
        active ? "bg-teal-50 text-teal-700" : "bg-muted text-muted-foreground"
      )}
    >
      {active ? "Ativa" : "Inativa"}
    </span>
  )
}
