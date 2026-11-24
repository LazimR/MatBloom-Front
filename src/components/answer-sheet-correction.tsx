"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { LoaderCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { get, post, postForm } from "@/services/request/Index"

type Scope = { kind: "classroom"; id: number } | { kind: "student"; id: number; classroomId: number }
type Exam = { id: number; name: string; theme: string; target_type: "turma" | "individual"; classroom_id: number | null; student_id: number | null; application_date: string | null; question_order_confirmed: boolean; counts_toward_average: boolean; questions: { itens: string[]; correct_item: number }[] }
type Success = { file: string; student_id: number; student_name: string; score: number; points: number; total_questions: number; responses: number[]; originalResponses?: number[]; wrong_questions: number[]; existing_attempts: number; error?: never }
type Failure = { file: string; error: string; student_id?: never }
type Preview = Success | Failure
type SavedResponse = { id: number; score: number; responses: number[]; wrong_questions: number[] }

type Props = { scope: Scope }

function detail(body: unknown, fallback: string) {
  return body && typeof body === "object" && "error" in body && typeof body.error === "string" ? body.error : fallback
}

export function AnswerSheetCorrection({ scope }: Props) {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [examId, setExamId] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [fileKey, setFileKey] = useState(0)
  const [results, setResults] = useState<Preview[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [saved, setSaved] = useState<number[]>([])
  const [verified, setVerified] = useState(false)
  const [countsTowardAverage, setCountsTowardAverage] = useState(true)
  const [uncertain, setUncertain] = useState(false)
  const [busy, setBusy] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const classroomId = scope.kind === "student" ? scope.classroomId : scope.id
  const studentId = scope.kind === "student" ? scope.id : null

  useEffect(() => {
    let active = true
    async function load() {
      const response = await get<Exam[]>("/test/applications")
      if (!active) return
      if (response.statusCode === 200 && Array.isArray(response.responseBody)) setExams(response.responseBody)
      else if (response.statusCode !== 404) setError(detail(response.responseBody, "Não foi possível carregar as aplicações."))
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [])

  const applicable = useMemo(() => exams.filter((exam) => exam.classroom_id === classroomId && (
    studentId === null ? exam.target_type === "turma" : exam.target_type === "turma" || (exam.target_type === "individual" && exam.student_id === studentId)
  )), [exams, classroomId, studentId])
  const selectedExam = applicable.find((exam) => exam.id === Number(examId))

  function clearPreview() { setResults([]); setSelected([]); setSaved([]); setVerified(false); setUncertain(false); setNotice(""); setError("") }

  async function preview() {
    clearPreview()
    if (!selectedExam || !selectedExam.question_order_confirmed) { setError("Selecione uma aplicação com ordem de questões confirmada."); return }
    if (!files.length) { setError("Selecione a imagem do gabarito."); return }
    if (studentId !== null && (files.length !== 1 || files[0].name.toLowerCase().endsWith(".zip"))) { setError("Para o aluno, selecione apenas uma imagem."); return }
    const body = new FormData()
    files.forEach((file) => body.append("images", file))
    const params = new URLSearchParams({ test_id: String(selectedExam.id), [studentId === null ? "classroom_id" : "student_id"]: String(studentId ?? classroomId) })
    setBusy("Lendo e corrigindo os gabaritos...")
    const response = await postForm<{ test_id: number; results: Preview[] }>(`/answer-sheet/preview?${params}`, body)
    if (response.statusCode === 200 && "results" in response.responseBody && Array.isArray(response.responseBody.results)) {
      const items = response.responseBody.results.map((item) => item.student_id !== undefined ? { ...item, originalResponses: [...item.responses] } : item)
      const counts = new Map<number, number>()
      items.forEach((item) => { if (item.student_id !== undefined) counts.set(item.student_id, (counts.get(item.student_id) ?? 0) + 1) })
      setResults(items)
      setSelected(items.flatMap((item, index) => item.student_id !== undefined && item.existing_attempts === 0 && counts.get(item.student_id) === 1 ? [index] : []))
      setNotice("Leitura concluída. Confira o aluno e as respostas antes de registrar as notas.")
    } else setError(detail(response.responseBody, "Não foi possível processar os arquivos."))
    setBusy("")
  }

  function updateAnswer(resultIndex: number, questionIndex: number, answer: number) {
    if (!selectedExam || busy || uncertain || saved.includes(resultIndex)) return
    setResults((previous) => previous.map((item, index) => {
      if (index !== resultIndex || item.student_id === undefined) return item
      const responses = [...item.responses]
      responses[questionIndex] = answer
      const wrong = responses.flatMap((value, i) => value !== selectedExam.questions[i].correct_item ? [i + 1] : [])
      const points = responses.length - wrong.length
      return { ...item, responses, wrong_questions: wrong, points, score: Math.round(1000 * points / responses.length) / 100 }
    }))
    setVerified(false)
  }

  async function saveResults() {
    if (!selectedExam || !verified || !selected.length) return
    setError(""); setNotice("")
    const completed: number[] = []
    let expectedAverageSetting = selectedExam.counts_toward_average
    for (const [position, index] of selected.entries()) {
      const item = results[index]
      if (item.student_id === undefined || saved.includes(index)) continue
      setBusy(`Registrando ${position + 1} de ${selected.length}...`)
      const response = await post<SavedResponse>("/answer-sheet/confirm", {
        test_id: selectedExam.id, student_id: item.student_id, score: item.score,
        responses: item.responses, wrong_questions: item.wrong_questions,
        counts_toward_average: countsTowardAverage, expected_counts_toward_average: expectedAverageSetting,
      })
      if (response.statusCode !== 200 || !("id" in response.responseBody)) {
        setSaved((previous) => [...previous, ...completed])
        setUncertain(true)
        setError(`${completed.length} registro(s) confirmado(s) nesta tentativa. Não foi possível confirmar o registro de ${item.file}: ${detail(response.responseBody, "erro de comunicação")}. Confira o histórico antes de repetir para evitar duplicatas.`)
        setBusy("")
        return
      }
      completed.push(index)
      const savedResult = response.responseBody as SavedResponse
      setResults((previous) => previous.map((result, resultIndex) => resultIndex === index && result.student_id !== undefined ? { ...result, score: savedResult.score, responses: savedResult.responses, wrong_questions: savedResult.wrong_questions, points: savedResult.responses.length - savedResult.wrong_questions.length } : result))
      expectedAverageSetting = countsTowardAverage
      setExams((previous) => previous.map((exam) => exam.id === selectedExam.id ? { ...exam, counts_toward_average: countsTowardAverage } : exam))
    }
    setSaved((previous) => [...previous, ...completed])
    setSelected([]); setVerified(false)
    setNotice(`${completed.length} resultado(s) registrado(s). Atualize a página para ver as análises atualizadas.`)
    setBusy("")
  }

  const duplicateIds = new Map<number, number>()
  results.forEach((item) => { if (item.student_id !== undefined) duplicateIds.set(item.student_id, (duplicateIds.get(item.student_id) ?? 0) + 1) })

  return <Card className="border-border/70">
    <CardHeader><CardTitle>Corrigir gabaritos</CardTitle><CardDescription>Selecione a aplicação e confira a leitura das imagens antes de registrar as notas.</CardDescription></CardHeader>
    <CardContent className="space-y-4">
      {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">{notice}</p>}
      {loading ? <p className="text-sm text-muted-foreground">Carregando aplicações...</p> : applicable.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma aplicação vinculada disponível para correção.</p> : <>
        <label className="block space-y-2 text-sm font-medium">Aplicação de prova<select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={examId} disabled={!!busy} onChange={(event) => { setExamId(event.target.value); setCountsTowardAverage(applicable.find((exam) => exam.id === Number(event.target.value))?.counts_toward_average ?? true); clearPreview() }}><option value="">Selecione uma aplicação</option>{applicable.map((exam) => <option key={exam.id} value={exam.id}>{exam.name} · {exam.theme} · {exam.target_type === "turma" ? "Turma" : "Individual"} · ID {exam.id}{!exam.question_order_confirmed ? " · ordem pendente" : ""}</option>)}</select></label>
        {selectedExam && <fieldset className="space-y-2 rounded-md border p-3"><legend className="px-1 text-sm font-medium">Esta atividade entra na média?</legend><label className="flex items-center gap-2 text-sm"><input type="radio" name="average-inclusion" checked={countsTowardAverage} disabled={!!busy || uncertain} onChange={() => { setCountsTowardAverage(true); setVerified(false) }} />Sim, considerar a nota na média</label><label className="flex items-center gap-2 text-sm"><input type="radio" name="average-inclusion" checked={!countsTowardAverage} disabled={!!busy || uncertain} onChange={() => { setCountsTowardAverage(false); setVerified(false) }} />Não, usar apenas para acompanhamento e reforço</label><p className="text-xs text-muted-foreground">A escolha vale para toda a aplicação. As respostas sempre continuam no histórico e nas análises de erros; a alteração será salva ao registrar um resultado.</p>{countsTowardAverage !== selectedExam.counts_toward_average && <p role="status" className="text-xs text-amber-800">Esta mudança também afetará a média de todos os alunos que já tenham nota nesta aplicação.</p>}</fieldset>}
        {selectedExam && !selectedExam.question_order_confirmed && <p className="text-sm text-amber-800">Confirme a ordem original da aplicação em <Link className="underline" href="/provas">Provas</Link> antes de corrigir.</p>}
        <label className="block space-y-2 text-sm font-medium">{studentId === null ? "Imagens ou arquivo ZIP" : "Imagem do gabarito"}<Input key={fileKey} type="file" accept={studentId === null ? ".jpg,.jpeg,.png,.webp,.zip,image/jpeg,image/png,image/webp,application/zip" : ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"} multiple={studentId === null} disabled={!!busy} onChange={(event) => { setFiles(Array.from(event.target.files ?? [])); clearPreview() }} /></label>
        <p className="text-xs text-muted-foreground">{studentId === null ? "Envie imagens soltas, ZIP ou ambos. Até 50 imagens; limite de 10 MB por imagem e 50 MB no lote." : "Envie uma imagem JPG, PNG ou WEBP de até 10 MB."}</p>
        <Button type="button" variant="outline" disabled={!!busy || !selectedExam || !selectedExam.question_order_confirmed || !files.length} onClick={preview}>Ler gabarito{studentId === null ? "s" : ""}</Button>
      </>}
      {busy && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />{busy}</p>}
      {results.length > 0 && <div className="space-y-3"><h3 className="font-semibold">Conferência dos resultados</h3><p className="text-sm text-muted-foreground">Confira o aluno identificado e as alternativas lidas. Resultados com notas anteriores ou imagens repetidas devem ser selecionados manualmente.</p>
        {results.map((item, index) => <div key={`${index}-${item.file}`} className="rounded-md border p-4 text-sm">
          <p className="break-all font-medium">{item.file}</p>
          {item.student_id === undefined ? <p className="mt-2 text-destructive">{item.error}</p> : <>
            <p className="mt-2">Aluno identificado: <strong>{item.student_name}</strong> · ID {item.student_id}</p>
            <p>Acertos: {item.points} de {item.total_questions} · Nota: {item.score.toFixed(2)} / 10</p>
            <p>Respostas incorretas: {item.wrong_questions.filter((question) => item.responses[question - 1] >= 0).join(", ") || "Nenhuma"}</p>
            <p>Questões em branco: {item.responses.map((answer, i) => answer < 0 ? i + 1 : null).filter((question) => question !== null).join(", ") || "Nenhuma"}</p>
            {item.responses.some((answer) => answer < 0) && <p className="text-muted-foreground">Questões em branco não recebem pontos.</p>}
            <details className="mt-2"><summary className="cursor-pointer">Conferir e editar respostas</summary>
              {selectedExam && selectedExam.questions.length === item.responses.length ? <div className="mt-3 space-y-3">
                <p className="text-muted-foreground">Altere a alternativa se a leitura não corresponder ao gabarito. A nota será atualizada.</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {item.responses.map((answer, i) => <label key={i} className="flex flex-col gap-1">Questão {i + 1}
                    <select aria-label={`Resposta da questão ${i + 1} de ${item.student_name}, arquivo ${item.file}`} className="h-10 rounded-md border border-input bg-background px-3" value={answer} disabled={!!busy || uncertain || saved.includes(index)} onChange={(event) => updateAnswer(index, i, Number(event.target.value))}>
                      <option value={-1}>Em branco</option>
                      {selectedExam.questions[i].itens.map((_, optionIndex) => <option key={optionIndex} value={optionIndex}>{String.fromCharCode(65 + optionIndex)}</option>)}
                    </select>
                    {item.originalResponses && answer !== item.originalResponses[i] && <span className="text-xs text-muted-foreground">Leitura original: {item.originalResponses[i] < 0 ? "em branco" : String.fromCharCode(65 + item.originalResponses[i])}</span>}
                  </label>)}
                </div>
              </div> : <p className="mt-2 text-destructive">Não foi possível carregar as questões da aplicação para editar as respostas. Atualize a página.</p>}
            </details>
            {item.existing_attempts > 0 && <p className="mt-2 text-amber-800">Este aluno já possui {item.existing_attempts} registro(s) nesta aplicação. Selecionar criará outra tentativa.</p>}
            {(duplicateIds.get(item.student_id) ?? 0) > 1 && <p className="mt-2 text-amber-800">Mais de uma imagem identificou este aluno. Confira antes de selecionar.</p>}
            {saved.includes(index) ? <p className="mt-2 font-medium text-teal-700">Nota registrada</p> : <label className="mt-3 flex items-center gap-2"><input type="checkbox" disabled={!!busy || uncertain} checked={selected.includes(index)} onChange={(event) => { setSelected((old) => event.target.checked ? [...old, index] : old.filter((value) => value !== index)); setVerified(false) }} />Registrar este resultado</label>}
          </>}
        </div>)}
        {!uncertain && selected.length > 0 && <><label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" disabled={!!busy} checked={verified} onChange={(event) => setVerified(event.target.checked)} />Conferi os alunos, as respostas e a opção de participação na média.</label><Button type="button" disabled={!verified || !!busy} onClick={saveResults}>Registrar {selected.length} resultado(s)</Button></>}
        {(saved.length > 0 || uncertain) && <Button type="button" variant="outline" disabled={!!busy} onClick={() => window.location.reload()}>Atualizar análise e histórico</Button>}
        <Button type="button" variant="ghost" disabled={!!busy} onClick={() => { clearPreview(); setFiles([]); setFileKey((key) => key + 1) }}>Limpar leitura</Button>
      </div>}
    </CardContent>
  </Card>
}
