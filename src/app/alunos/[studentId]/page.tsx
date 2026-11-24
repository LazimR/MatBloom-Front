"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { ArrowLeft, BookOpen, GraduationCap, Sparkles, TrendingUp } from "lucide-react"

import { get, put } from "@/services/request/Index"
import { AnswerSheetCorrection } from "@/components/answer-sheet-correction"
import { useAppSelector } from "@/hooks/Redux"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type StudentResponse = {
  id: number
  test_id: number
  student_id: number
  score: number
  responses: number[]
  wrong_questions: number[]
  attempt_date: string
}

type StudentDetail = {
  id: number
  name: string
  registration: string
  classroom_id: number
  active: boolean
  created_at: string
  test_responses: StudentResponse[]
}

type ClassroomOption = {
  id: number
  name: string
  school_year: number
  grade_level: string
}

type StudentAnalysis = {
  student_id: number
  student_name: string
  classroom_id: number
  overall_average: number | null
  total_attempts: number
  unordered_attempts: number
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
}

type TestDetail = {
  counts_toward_average: boolean
  id: number
  name: string
  theme: string
  kind: string
  student_id: number | null
  classroom_id: number | null
  target_type: string
}

export default function StudentDetailPage() {
  const params = useParams<{ studentId: string }>()
  const studentId = params.studentId
  const user = useAppSelector((state) => state.user)
  const canEdit = user.role === "admin" || user.role === "diretor"

  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [analysis, setAnalysis] = useState<StudentAnalysis | null>(null)
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([])
  const [testDetails, setTestDetails] = useState<Record<number, TestDetail>>({})
  const [editForm, setEditForm] = useState({
    name: "",
    registration: "",
    classroom_id: "",
    active: true,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    let isMounted = true

    async function loadStudentData() {
      setIsLoading(true)
      setErrorMessage("")

      const [studentResponse, analysisResponse, classroomsResponse] = await Promise.all([
        get<StudentDetail>(`/student/${studentId}`),
        get<StudentAnalysis>(`/student/${studentId}/analysis`),
        canEdit ? get<ClassroomOption[]>("/classroom/") : Promise.resolve(null),
      ])

      if (!isMounted) {
        return
      }

      const studentOk = studentResponse.statusCode === 200 && "id" in studentResponse.responseBody
      const analysisOk = analysisResponse.statusCode === 200 && "student_id" in analysisResponse.responseBody

      if (!studentOk || !analysisOk || !("id" in studentResponse.responseBody) || !("student_id" in analysisResponse.responseBody)) {
        setErrorMessage(
          !studentOk && "error" in studentResponse.responseBody
            ? studentResponse.responseBody.error
            : !analysisOk && "error" in analysisResponse.responseBody
              ? analysisResponse.responseBody.error
              : "Não foi possível carregar o aluno."
        )
        setIsLoading(false)
        return
      }

      const nextStudent = studentResponse.responseBody
      const nextAnalysis = analysisResponse.responseBody

      setStudent(nextStudent)
      setAnalysis(nextAnalysis)
      setEditForm({
        name: nextStudent.name,
        registration: nextStudent.registration,
        classroom_id: String(nextStudent.classroom_id),
        active: nextStudent.active,
      })

      if (canEdit && classroomsResponse?.statusCode === 200 && Array.isArray(classroomsResponse.responseBody)) {
        setClassrooms(classroomsResponse.responseBody)
      }

      const uniqueTestIds = Array.from(new Set(nextStudent.test_responses.map((response) => response.test_id)))
      if (uniqueTestIds.length > 0) {
        const tests = await Promise.all(uniqueTestIds.map((testId) => get<TestDetail>(`/test/${testId}`)))
        if (!isMounted) {
          return
        }
        const nextTestDetails: Record<number, TestDetail> = {}
        tests.forEach((response) => {
          if (response.statusCode === 200 && "id" in response.responseBody) {
            nextTestDetails[response.responseBody.id] = response.responseBody
          }
        })
        setTestDetails(nextTestDetails)
      } else {
        setTestDetails({})
      }

      setIsLoading(false)
    }

    if (studentId) {
      loadStudentData()
    }

    return () => {
      isMounted = false
    }
  }, [studentId, canEdit])

  const testAverageBars = useMemo(() => {
    if (!analysis) {
      return []
    }

    return analysis.average_by_test.map((item) => ({
      ...item,
      width: `${Math.max(8, Math.min(100, item.average_score * 10))}%`,
      theme: testDetails[item.test_id]?.theme || "Tema não disponível",
    }))
  }, [analysis, testDetails])

  async function handleSaveStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!student) {
      return
    }

    setIsSaving(true)
    setErrorMessage("")
    setSuccessMessage("")

    const response = await put<StudentDetail>("/student/", {
      id: student.id,
      name: editForm.name,
      registration: editForm.registration,
      classroom_id: Number(editForm.classroom_id),
      active: editForm.active,
    })

    if (response.statusCode !== 200 || !("id" in response.responseBody)) {
      setErrorMessage(
        "error" in response.responseBody
          ? response.responseBody.error
          : "Não foi possível atualizar o aluno."
      )
      setIsSaving(false)
      return
    }

    setStudent(response.responseBody)
    setSuccessMessage("Dados do aluno atualizados com sucesso.")
    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <main className="mx-auto max-w-7xl px-6 py-8">
          <Card className="border-border/70">
            <CardContent className="pt-6 text-sm text-muted-foreground">Carregando aluno...</CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (!student || !analysis) {
    return (
      <div className="min-h-screen bg-muted/30">
        <main className="mx-auto max-w-7xl px-6 py-8">
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="pt-6 text-sm text-destructive">{errorMessage || "Aluno não encontrado."}</CardContent>
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
              href={student.classroom_id ? `/turmas/${student.classroom_id}` : "/turmas"}
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para turma
            </Link>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{student.name}</h1>
              <p className="mt-2 text-muted-foreground">
                Matrícula {student.registration} • {canEdit ? "Edição habilitada" : "Visualização do professor"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700">
              {student.active ? "Aluno ativo" : "Aluno inativo"}
            </span>
            {student.active && <Button asChild><Link href={`/provas?aluno=${student.id}`}>Gerar prova de reforço</Link></Button>}
          </div>
        </div>

        {analysis.unordered_attempts > 0 && <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{analysis.unordered_attempts} resposta(s) de provas antigas não entram nas análises por conteúdo e Bloom porque a ordem das questões não foi registrada. As notas continuam nas médias.</p>}

        {errorMessage ? (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="pt-6 text-sm text-destructive">{errorMessage}</CardContent>
          </Card>
        ) : null}
        {successMessage ? (
          <Card className="border-teal-200 bg-teal-50/70">
            <CardContent className="pt-6 text-sm text-teal-800">{successMessage}</CardContent>
          </Card>
        ) : null}

        <AnswerSheetCorrection scope={{ kind: "student", id: student.id, classroomId: student.classroom_id }} />

        <section className="grid gap-4 xl:grid-cols-4">
          <MetricCard
            icon={TrendingUp}
            label="Média geral"
            value={analysis.overall_average !== null ? analysis.overall_average.toFixed(2) : "Sem nota"}
            helper="Somente atividades que contam para a média"
          />
          <MetricCard
            icon={BookOpen}
            label="Tentativas"
            value={String(analysis.total_attempts)}
            helper="Quantidade de respostas registradas"
          />
          <MetricCard
            icon={GraduationCap}
            label="Turma"
            value={String(student.classroom_id)}
            helper="Turma atual do aluno"
          />
          <MetricCard
            icon={Sparkles}
            label="Testes"
            value={String(analysis.average_by_test.length)}
            helper="Avaliações diferentes realizadas"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_1.2fr]">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Dados do aluno</CardTitle>
              <CardDescription>
                {canEdit
                  ? "Admin e diretor podem editar os dados cadastrais do aluno."
                  : "Professor visualiza os dados cadastrais sem permissão de edição."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {canEdit ? (
                <form className="space-y-4" onSubmit={handleSaveStudent}>
                  <div className="space-y-2">
                    <label htmlFor="student-name" className="text-sm font-medium text-foreground">
                      Nome
                    </label>
                    <Input
                      id="student-name"
                      value={editForm.name}
                      onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="student-registration" className="text-sm font-medium text-foreground">
                      Matrícula
                    </label>
                    <Input
                      id="student-registration"
                      value={editForm.registration}
                      onChange={(event) =>
                        setEditForm((current) => ({ ...current, registration: event.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="student-classroom" className="text-sm font-medium text-foreground">
                      Turma
                    </label>
                    <select
                      id="student-classroom"
                      value={editForm.classroom_id}
                      onChange={(event) =>
                        setEditForm((current) => ({ ...current, classroom_id: event.target.value }))
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {classrooms.map((classroom) => (
                        <option key={classroom.id} value={classroom.id}>
                          {classroom.name} • {classroom.grade_level} • {classroom.school_year}
                        </option>
                      ))}
                    </select>
                  </div>
                  <label className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editForm.active}
                      onChange={(event) =>
                        setEditForm((current) => ({ ...current, active: event.target.checked }))
                      }
                    />
                    Aluno ativo
                  </label>
                  <Button
                    type="submit"
                    className="bg-teal-700 text-white hover:bg-teal-800"
                    disabled={isSaving}
                  >
                    {isSaving ? "Salvando..." : "Salvar alterações"}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4 text-sm">
                  <InfoRow label="Nome" value={student.name} />
                  <InfoRow label="Matrícula" value={student.registration} />
                  <InfoRow label="Turma" value={String(student.classroom_id)} />
                  <InfoRow label="Status" value={student.active ? "Ativo" : "Inativo"} />
                  <InfoRow label="Criado em" value={new Date(student.created_at).toLocaleDateString("pt-BR")} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Desempenho por teste</CardTitle>
              <CardDescription>Média do aluno em cada teste realizado.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {testAverageBars.length === 0 ? (
                <p className="text-sm text-muted-foreground">O aluno ainda não possui avaliações registradas.</p>
              ) : (
                testAverageBars.map((item) => (
                  <div key={item.test_id} className="space-y-1">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{item.test_name}</p>
                        <p className="truncate text-xs text-muted-foreground">{item.theme}</p>
                      </div>
                      <span className="shrink-0 text-muted-foreground">{item.average_score.toFixed(2)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-sky-600" style={{ width: item.width }} />
                    </div>
                    <p className="text-xs text-muted-foreground">{item.attempts} tentativa(s)</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Histórico de respostas</CardTitle>
              <CardDescription>Testes já realizados e respectivas tentativas do aluno.</CardDescription>
            </CardHeader>
            <CardContent>
              {student.test_responses.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma resposta registrada para este aluno.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teste</TableHead>
                      <TableHead>Tema</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Nota</TableHead>
                      <TableHead>Conta na média</TableHead>
                      <TableHead>Erros</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.test_responses.map((response) => (
                      <TableRow key={response.id}>
                        <TableCell>{testDetails[response.test_id]?.name || `Teste ${response.test_id}`}</TableCell>
                        <TableCell>{testDetails[response.test_id]?.theme || "Tema não disponível"}</TableCell>
                        <TableCell>{new Date(response.attempt_date).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>{response.score?.toFixed?.(2) ?? response.score}</TableCell>
                        <TableCell>{testDetails[response.test_id] ? (testDetails[response.test_id].counts_toward_average ? "Sim" : "Não") : "—"}</TableCell>
                        <TableCell>{response.wrong_questions.length}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Síntese Diagnóstica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="rounded-md border border-border p-3">
                  <p className="text-sm font-medium text-foreground">Conteúdos com mais erro</p>
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {analysis.errors_by_content.length === 0 ? (
                      <p>Nenhum erro consolidado por conteúdo até o momento.</p>
                    ) : (
                      analysis.errors_by_content.slice(0, 3).map((item) => (
                        <div key={item.content_name} className="flex items-center justify-between gap-4">
                          <span>{item.content_name}</span>
                          <span>{item.wrong_count} erro(s)</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-md border border-border p-3">
                  <p className="text-sm font-medium text-foreground">Níveis de Bloom com mais erro</p>
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {analysis.errors_by_bloom.length === 0 ? (
                      <p>Nenhum erro consolidado por nível cognitivo até o momento.</p>
                    ) : (
                      analysis.errors_by_bloom.slice(0, 3).map((item) => (
                        <div key={item.level} className="flex items-center justify-between gap-4">
                          <span>{item.level_name}</span>
                          <span>{item.wrong_count} erro(s)</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Dificuldades por conteúdo</CardTitle>
              <CardDescription>Conteúdos em que o aluno mais erra.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysis.errors_by_content.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma dificuldade consolidada ainda.</p>
              ) : (
                analysis.errors_by_content.map((item) => (
                  <BarItem
                    key={item.content_name}
                    label={item.content_name}
                    value={item.wrong_count}
                    maxValue={analysis.errors_by_content[0].wrong_count}
                  />
                ))
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
  icon: typeof TrendingUp
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
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
