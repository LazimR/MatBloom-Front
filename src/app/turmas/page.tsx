"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { BookOpen, Search, Users } from "lucide-react"

import { get } from "@/services/request/Index"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type ClassroomListItem = {
  id: number
  name: string
  school_year: number
  grade_level: string
  shift: string
  active: boolean
  teachers: {
    id: number
    username: string
    email: string
  }[]
  students: {
    id: number
    name: string
  }[]
}

const shiftLabels: Record<string, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
  matutino_vespertino: "Matutino/Vespertino",
  integral: "Integral",
}

export default function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState<ClassroomListItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    let isMounted = true

    async function loadClassrooms() {
      setIsLoading(true)
      setErrorMessage("")

      const response = await get<ClassroomListItem[]>("/classroom/")

      if (!isMounted) {
        return
      }

      if (response.statusCode !== 200 || !Array.isArray(response.responseBody)) {
        setErrorMessage(
          "error" in response.responseBody
            ? response.responseBody.error
            : "Não foi possível carregar as turmas."
        )
        setIsLoading(false)
        return
      }

      setClassrooms(response.responseBody)
      setIsLoading(false)
    }

    loadClassrooms()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredClassrooms = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) {
      return classrooms
    }

    return classrooms.filter((classroom) =>
      `${classroom.name} ${classroom.grade_level} ${classroom.school_year} ${classroom.teachers
        .map((teacher) => teacher.username)
        .join(" ")}`
        .toLowerCase()
        .includes(normalizedSearch)
    )
  }, [classrooms, searchTerm])

  return (
    <div className="min-h-screen bg-muted/30">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
        <Card className="border-border/70">
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-3xl tracking-tight">Turmas</CardTitle>
                <CardDescription className="mt-2 text-base">
                  Selecione uma turma para visualizar alunos, desempenho e dificuldades gerais.
                </CardDescription>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar por turma, série ou professor"
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
        </Card>

        {errorMessage ? (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="pt-6 text-sm text-destructive">{errorMessage}</CardContent>
          </Card>
        ) : null}

        {isLoading ? (
          <Card className="border-border/70">
            <CardContent className="pt-6 text-sm text-muted-foreground">Carregando turmas...</CardContent>
          </Card>
        ) : filteredClassrooms.length === 0 ? (
          <Card className="border-border/70">
            <CardContent className="pt-6 text-sm text-muted-foreground">Nenhuma turma encontrada.</CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredClassrooms.map((classroom) => (
              <Link key={classroom.id} href={`/turmas/${classroom.id}`} className="block">
                <Card className="h-full border-border/70 transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-xl">{classroom.name}</CardTitle>
                        <CardDescription>
                          {classroom.grade_level} • {classroom.school_year} • {shiftLabels[classroom.shift] || classroom.shift}
                        </CardDescription>
                      </div>
                      <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
                        {classroom.active ? "Ativa" : "Inativa"}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {classroom.students.length} aluno{classroom.students.length === 1 ? "" : "s"}
                    </div>
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <BookOpen className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        {classroom.teachers.length > 0
                          ? classroom.teachers.map((teacher) => teacher.username).join(", ")
                          : "Nenhum professor vinculado"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
