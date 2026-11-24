"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { ArrowLeft, BarChart3, BookOpen, TrendingUp, Users, X } from "lucide-react"

import { get } from "@/services/request/Index"
import { useAppSelector } from "@/hooks/Redux"
import { ClassroomForm } from "@/components/classroom-form"
import { ClassroomTeachers } from "@/components/classroom-teachers"
import { AnswerSheetCorrection } from "@/components/answer-sheet-correction"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type ClassroomTeacher = {
  id: number
  username: string
  email: string
}

type ClassroomStudent = {
  id: number
  name: string
}

type ClassroomDetail = {
  id: number
  name: string
  school_year: number
  grade_level: string
  shift: string
  active: boolean
  teachers: ClassroomTeacher[]
  students: ClassroomStudent[]
}

type ClassroomAnalysis = {
  classroom_id: number
  classroom_name: string
  school_year: number
  grade_level: string
  shift: string
  student_count: number
  active_students: number
  unordered_attempts: number
  overall_average: number | null
  average_by_test: {
    test_id: number
    test_name: string
    average_score: number
    attempts: number
  }[]
  bloom_performance: {
    level: number
    level_name: string
    total_questions: number
    correct_answers: number
    wrong_answers: number
    accuracy: number
  }[]
  errors_by_content: {
    content_name: string
    wrong_count: number
  }[]
  errors_by_bloom: {
    level: number
    level_name: string
    wrong_count: number
  }[]
  student_averages: {
    student_id: number
    student_name: string
    average_score: number | null
    attempts: number
  }[]
}

const shiftLabels: Record<string, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
  matutino_vespertino: "Matutino/Vespertino",
  integral: "Integral",
}

export default function ClassroomDetailPage() {
  const params = useParams<{ classroomId: string }>()
  const classroomId = params.classroomId
  const role = useAppSelector((state) => state.user.role)
  const [editing, setEditing] = useState(false)
  const [editSuccess, setEditSuccess] = useState("")

  const [classroom, setClassroom] = useState<ClassroomDetail | null>(null)
  const [analysis, setAnalysis] = useState<ClassroomAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    let isMounted = true

    async function loadClassroomData() {
      setIsLoading(true)
      setErrorMessage("")

      const [classroomResponse, analysisResponse] = await Promise.all([
        get<ClassroomDetail>(`/classroom/${classroomId}`),
        get<ClassroomAnalysis>(`/classroom/${classroomId}/analysis`),
      ])

      if (!isMounted) {
        return
      }

      const classroomOk = classroomResponse.statusCode === 200 && "id" in classroomResponse.responseBody
      const analysisOk = analysisResponse.statusCode === 200 && "classroom_id" in analysisResponse.responseBody

      if (!classroomOk || !analysisOk || !("id" in classroomResponse.responseBody) || !("classroom_id" in analysisResponse.responseBody)) {
        setErrorMessage(
          !classroomOk && "error" in classroomResponse.responseBody
            ? classroomResponse.responseBody.error
            : !analysisOk && "error" in analysisResponse.responseBody
              ? analysisResponse.responseBody.error
              : "Não foi possível carregar a turma."
        )
        setIsLoading(false)
        return
      }

      setClassroom(classroomResponse.responseBody)
      setAnalysis(analysisResponse.responseBody)
      setIsLoading(false)
    }

    if (classroomId) {
      loadClassroomData()
    }

    return () => {
      isMounted = false
    }
  }, [classroomId])

  const studentAverageBars = useMemo(() => {
    if (!analysis) {
      return []
    }

    return analysis.student_averages.map((student) => ({
      ...student,
      width: `${Math.max(6, Math.min(100, (student.average_score ?? 0) * 10))}%`,
    }))
  }, [analysis])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <main className="mx-auto max-w-7xl px-6 py-8">
          <Card className="border-border/70">
            <CardContent className="pt-6 text-sm text-muted-foreground">Carregando turma...</CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (!classroom || !analysis) {
    return (
      <div className="min-h-screen bg-muted/30">
        <main className="mx-auto max-w-7xl px-6 py-8">
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="pt-6 text-sm text-destructive">{errorMessage || "Turma não encontrada."}</CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Link
              href="/turmas"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para turmas
            </Link>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{classroom.name}</h1>
              <p className="mt-2 text-muted-foreground">
                {classroom.grade_level} • {classroom.school_year} • {shiftLabels[classroom.shift] || classroom.shift}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700">
              {classroom.active ? "Turma ativa" : "Turma inativa"}
            </span>
            {(role === "admin" || role === "diretor") && classroom.active && <Button asChild variant="outline"><Link href={`/gerenciarEstudantes?turma=${classroom.id}`}>Cadastrar aluno</Link></Button>}
            {(role === "admin" || role === "diretor") && <Dialog.Root>
              <Dialog.Trigger asChild><Button type="button" variant="outline">Professores da turma</Button></Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border bg-background p-6 shadow-lg">
                  <Dialog.Title className="pr-8 text-lg font-semibold">Professores da turma</Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-muted-foreground">Vincule professores para que possam acessar os dados desta turma.</Dialog.Description>
                  <Dialog.Close asChild><button type="button" aria-label="Fechar" className="absolute right-4 top-4 rounded-sm p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><X className="h-4 w-4" /></button></Dialog.Close>
                  <div className="mt-5"><ClassroomTeachers classroom={classroom} onUpdated={setClassroom} /></div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>}
            {(role === "admin" || role === "diretor") && !editing && <Button type="button" variant="outline" onClick={() => { setEditing(true); setEditSuccess("") }}>Editar turma</Button>}
            {classroom.active && <Button asChild><Link href={`/provas?turma=${classroom.id}`}>Gerar prova de reforço</Link></Button>}
          </div>
        </div>

        {editing && (role === "admin" || role === "diretor") && <ClassroomForm classroom={classroom} onCancel={() => setEditing(false)} onSaved={(updated) => { setClassroom(updated); setAnalysis((current) => current ? { ...current, classroom_name: updated.name, school_year: updated.school_year, grade_level: updated.grade_level, shift: updated.shift } : current); setEditing(false); setEditSuccess("Turma atualizada com sucesso.") }} />}
        {editSuccess && <p role="status" className="rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">{editSuccess}</p>}

        {analysis.unordered_attempts > 0 && <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{analysis.unordered_attempts} resposta(s) de provas antigas não entram nas análises por conteúdo e Bloom porque a ordem das questões não foi registrada. As notas continuam nas médias.</p>}

        <AnswerSheetCorrection scope={{ kind: "classroom", id: classroom.id }} />

        <section className="grid gap-4 xl:grid-cols-4">
          <MetricCard
            icon={Users}
            label="Alunos"
            value={String(analysis.student_count)}
            helper={`${analysis.active_students} ativos`}
          />
          <MetricCard
            icon={TrendingUp}
            label="Média geral"
            value={analysis.overall_average !== null ? analysis.overall_average.toFixed(2) : "Sem notas"}
            helper="Somente atividades que contam para a média"
          />
          <MetricCard
            icon={BookOpen}
            label="Professores"
            value={String(classroom.teachers.length)}
            helper={
              classroom.teachers.length > 0
                ? classroom.teachers.map((teacher) => teacher.username).join(", ")
                : "Nenhum professor vinculado"
            }
          />
          <MetricCard
            icon={BarChart3}
            label="Avaliações"
            value={String(analysis.average_by_test.length)}
            helper="Provas com média agregada"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Lista de alunos</CardTitle>
              <CardDescription>Estudantes cadastrados nesta turma.</CardDescription>
            </CardHeader>
            <CardContent>
              {classroom.students.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum aluno cadastrado.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Média</TableHead>
                      <TableHead>Tentativas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis.student_averages.map((student) => (
                      <TableRow key={student.student_id}>
                        <TableCell>{student.student_id}</TableCell>
                        <TableCell>
                          <Link href={`/alunos/${student.student_id}`} className="font-medium text-teal-700 hover:underline">
                            {student.student_name}
                          </Link>
                        </TableCell>
                        <TableCell>{student.average_score !== null ? student.average_score.toFixed(2) : "Sem nota"}</TableCell>
                        <TableCell>{student.attempts}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Dificuldades Gerais</CardTitle>
              <CardDescription>Conteúdos e níveis de Bloom com mais erros na turma.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Por conteúdo</h3>
                {analysis.errors_by_content.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma dificuldade consolidada ainda.</p>
                ) : (
                  <div className="space-y-3">
                    {analysis.errors_by_content.slice(0, 5).map((item) => (
                      <BarItem
                        key={item.content_name}
                        label={item.content_name}
                        value={item.wrong_count}
                        maxValue={analysis.errors_by_content[0].wrong_count}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Por nível cognitivo</h3>
                {analysis.errors_by_bloom.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum erro por Bloom registrado.</p>
                ) : (
                  <div className="space-y-3">
                    {analysis.errors_by_bloom.map((item) => (
                      <BarItem
                        key={item.level}
                        label={item.level_name}
                        value={item.wrong_count}
                        maxValue={Math.max(...analysis.errors_by_bloom.map((bloom) => bloom.wrong_count))}
                      />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Notas dos alunos</CardTitle>
              <CardDescription>Distribuição das médias individuais da turma.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {studentAverageBars.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ainda não existem notas registradas para esta turma.</p>
              ) : (
                <div className="space-y-4">
                  {studentAverageBars.map((student) => (
                    <div key={student.student_id} className="space-y-1">
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="truncate font-medium text-foreground">{student.student_name}</span>
                        <span className="shrink-0 text-muted-foreground">
                          {student.average_score !== null ? student.average_score.toFixed(2) : "Sem nota"}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-teal-600" style={{ width: student.width }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Desempenho por Bloom</CardTitle>
              <CardDescription>Percentual de acerto por nível cognitivo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.bloom_performance.map((item) => (
                <div key={item.level} className="space-y-1">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium text-foreground">{item.level_name}</span>
                    <span className="text-muted-foreground">{item.accuracy.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-sky-600"
                      style={{ width: `${Math.max(4, Math.min(100, item.accuracy))}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.correct_answers} acertos • {item.wrong_answers} erros • {item.total_questions} questões
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
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
  icon: typeof Users
  label: string
  value: string
  helper: string
}) {
  return (
    <Card className="border-border/70">
      <CardContent className="flex items-start justify-between gap-4 pt-6">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
          <p className="mt-2 text-xs text-muted-foreground">{helper}</p>
        </div>
        <div className="rounded-full bg-teal-50 p-2 text-teal-700">
          <Icon className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  )
}

function BarItem({
  label,
  value,
  maxValue,
}: {
  label: string
  value: number
  maxValue: number
}) {
  const width = maxValue > 0 ? `${Math.max(8, Math.min(100, (value / maxValue) * 100))}%` : "0%"

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="truncate font-medium text-foreground">{label}</span>
        <span className="shrink-0 text-muted-foreground">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div className="h-2 rounded-full bg-amber-500" style={{ width }} />
      </div>
    </div>
  )
}
