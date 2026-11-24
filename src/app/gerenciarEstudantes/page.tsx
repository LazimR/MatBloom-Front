"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { get } from "@/services/request/Index"
import { useAppSelector } from "@/hooks/Redux"
import { StudentCreateForm, type StudentClassroomOption } from "@/components/student-create-form"

type Student = { id: number; name: string; registration: string; classroom_id: number; active: boolean }
type Classroom = StudentClassroomOption

const PAGE_SIZE = 10

export default function ManageStudentsPage() {
  const role = useAppSelector((state) => state.user.role)
  const [creating, setCreating] = useState(false)
  const [initialClassroomId, setInitialClassroomId] = useState<number | undefined>()
  const [success, setSuccess] = useState("")
  const [students, setStudents] = useState<Student[]>([])
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true
    async function load() {
      const [studentResult, classroomResult] = await Promise.all([
        get<Student[]>("/student/"),
        get<Classroom[]>("/classroom/"),
      ])
      if (!mounted) return
      if (studentResult.statusCode !== 200 || !Array.isArray(studentResult.responseBody)) {
        setError("error" in studentResult.responseBody ? studentResult.responseBody.error : "Não foi possível carregar os alunos.")
      } else {
        setStudents(studentResult.responseBody)
      }
      if (classroomResult.statusCode === 200 && Array.isArray(classroomResult.responseBody)) {
        setClassrooms(classroomResult.responseBody)
        const requested = new URLSearchParams(window.location.search).get("turma")
        if (requested && /^\d+$/.test(requested) && classroomResult.responseBody.some((classroom) => classroom.id === Number(requested) && classroom.active)) {
          setInitialClassroomId(Number(requested))
          setCreating(true)
        }
      } else {
        setError("Não foi possível carregar as turmas.")
      }
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  const classroomNames = useMemo(() => new Map(classrooms.map((classroom) => [classroom.id, classroom.name])), [classrooms])
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR")
    return students.filter((student) =>
      `${student.name} ${student.registration} ${classroomNames.get(student.classroom_id) ?? ""}`.toLocaleLowerCase("pt-BR").includes(term)
    )
  }, [students, classroomNames, search])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visibleStudents = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="min-h-screen bg-muted/30">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
        {(role === "admin" || role === "diretor") && !creating && <div><Button type="button" onClick={() => { setInitialClassroomId(undefined); setCreating(true); setSuccess("") }}>Cadastrar aluno</Button></div>}
        {creating && (role === "admin" || role === "diretor") && <StudentCreateForm classrooms={classrooms} initialClassroomId={initialClassroomId} onCancel={() => setCreating(false)} onSaved={(student) => { setStudents((current) => [...current, student]); setCreating(false); setSearch(""); setPage(1); setSuccess("Aluno cadastrado com sucesso.") }} />}
        {success && <p role="status" className="rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">{success}</p>}
        <Card className="border-border/70">
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-3xl tracking-tight">Alunos</CardTitle>
                <CardDescription className="mt-2 text-base">Consulte os alunos disponíveis e acesse seus detalhes e análises.</CardDescription>
              </div>
              <div className="relative w-full md:w-80">
                <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input aria-label="Buscar alunos" placeholder="Buscar por nome, matrícula ou turma" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} className="pl-10" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && <p role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
            {loading ? <p className="py-8 text-center text-sm text-muted-foreground">Carregando alunos...</p> : filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{error && students.length === 0 ? "Não foi possível exibir os alunos." : "Nenhum aluno encontrado."}</p>
            ) : (
              <>
                <Table>
                  <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Matrícula</TableHead><TableHead>Turma</TableHead><TableHead>Situação</TableHead><TableHead><span className="sr-only">Detalhes</span></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {visibleStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.registration}</TableCell>
                        <TableCell>{classroomNames.get(student.classroom_id) ?? `Turma ${student.classroom_id}`}</TableCell>
                        <TableCell>{student.active ? "Ativo" : "Inativo"}</TableCell>
                        <TableCell><Button asChild variant="outline" size="sm"><Link href={`/alunos/${student.id}`} aria-label={`Ver detalhes de ${student.name}`}>Ver detalhes</Link></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                  <span>{filtered.length} aluno{filtered.length === 1 ? "" : "s"} · Página {page} de {totalPages}</span>
                  <div className="flex gap-2"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Anterior</Button><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Próxima</Button></div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
