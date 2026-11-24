"use client"

import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { LoaderCircle, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { downloadFile, get, post, put } from "@/services/request/Index"

type Question = { id: number; enunciation: string; itens: string[]; level: number; contents: string[] }
type Classroom = { id: number; name: string; school_year: number; active: boolean }
type Student = { id: number; name: string; registration: string; classroom_id: number; active: boolean }
type Exam = { question_order_confirmed: boolean; id: number; name: string; theme: string; target_type: string; classroom_id: number | null; student_id: number | null; application_date: string | null; questions: Question[] }
type Content = { id: number; name: string }
const levels = ["Não classificada", "Lembrar", "Entender", "Aplicar", "Analisar", "Avaliar", "Criar"]
const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

function getError(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "error" in body && typeof body.error === "string") return body.error
  return fallback
}

export default function ExamsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [contents, setContents] = useState<Content[]>([])
  const [applications, setApplications] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [busy, setBusy] = useState("")
  const [name, setName] = useState("")
  const [theme, setTheme] = useState("")
  const [date, setDate] = useState("")
  const [target, setTarget] = useState<"turma" | "individual">("turma")
  const [classroomId, setClassroomId] = useState("")
  const [studentId, setStudentId] = useState("")
  const [mode, setMode] = useState<"manual" | "automatico" | "reforco">("manual")
  const [search, setSearch] = useState("")
  const [levelFilter, setLevelFilter] = useState("")
  const [contentFilter, setContentFilter] = useState("")
  const [contentFilterQuery, setContentFilterQuery] = useState("")
  const [filterMenuOpen, setFilterMenuOpen] = useState(false)
  const [questionPage, setQuestionPage] = useState(1)
  const [contentSearch, setContentSearch] = useState("")
  const [selectedContents, setSelectedContents] = useState<string[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [selectionFromAnalysis, setSelectionFromAnalysis] = useState(false)
  const [quantity, setQuantity] = useState(10)
  const [drawMessage, setDrawMessage] = useState<{ text: string; error: boolean } | null>(null)
  const [templateId, setTemplateId] = useState<number | null>(null)
  const [applicationId, setApplicationId] = useState<number | null>(null)
  const [locked, setLocked] = useState(false)
  const [orderExam, setOrderExam] = useState<Exam | null>(null)
  const [orderIds, setOrderIds] = useState<number[]>([])
  const [orderVerified, setOrderVerified] = useState(false)
  const questionSelectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    async function load() {
      const [q, c, s, t, a] = await Promise.all([
        get<Question[]>("/question/all_questions"), get<Classroom[]>("/classroom/"),
        get<Student[]>("/student/"), get<Content[]>("/content/"), get<Exam[]>("/test/applications"),
      ])
      if (!active) return
      if (q.statusCode === 200 && Array.isArray(q.responseBody)) setQuestions(q.responseBody)
      else if (!(q.statusCode === 404 && getError(q.responseBody, "") === "Não há nenhuma questão cadastrada.")) setError(getError(q.responseBody, "Não foi possível carregar as questões."))
      if (c.statusCode === 200 && Array.isArray(c.responseBody)) setClassrooms(c.responseBody)
      else setError(getError(c.responseBody, "Não foi possível carregar as turmas."))
      if (s.statusCode === 200 && Array.isArray(s.responseBody)) setStudents(s.responseBody)
      else setError(getError(s.responseBody, "Não foi possível carregar os alunos."))
      if (t.statusCode === 200 && Array.isArray(t.responseBody)) setContents(t.responseBody)
      else setError(getError(t.responseBody, "Não foi possível carregar os conteúdos."))
      if (a.statusCode === 200 && Array.isArray(a.responseBody)) setApplications(a.responseBody)
      else if (a.statusCode !== 404) setError(getError(a.responseBody, "Não foi possível carregar as aplicações."))
      const params = new URLSearchParams(window.location.search)
      const requestedStudent = params.get("aluno")
      const requestedClassroom = params.get("turma")
      if (requestedStudent && /^\d+$/.test(requestedStudent) && Array.isArray(s.responseBody)) {
        const student = s.responseBody.find((item) => item.id === Number(requestedStudent) && item.active)
        if (student) {
          setTarget("individual")
          setStudentId(String(student.id))
          setClassroomId(Array.isArray(c.responseBody) && c.responseBody.some((item) => item.id === student.classroom_id && item.active) ? String(student.classroom_id) : "")
          setMode("reforco")
        } else setError("Aluno não encontrado ou indisponível para esta aplicação.")
      } else if (requestedClassroom && /^\d+$/.test(requestedClassroom) && Array.isArray(c.responseBody)) {
        const classroom = c.responseBody.find((item) => item.id === Number(requestedClassroom) && item.active)
        if (classroom) { setTarget("turma"); setClassroomId(String(classroom.id)); setMode("reforco") }
        else setError("Turma não encontrada ou indisponível para esta aplicação.")
      }
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [])

  const questionContents = useMemo(() => [...new Set(questions.flatMap((q) => q.contents))].sort((a, b) => a.localeCompare(b, "pt-BR")), [questions])
  const filteredQuestions = useMemo(() => questions.filter((q) =>
    normalize(`${q.id} ${q.enunciation} ${q.contents.join(" ")}`).includes(normalize(search.trim())) &&
    (levelFilter === "" || q.level === Number(levelFilter)) &&
    (!contentFilter || q.contents.includes(contentFilter))
  ), [questions, search, levelFilter, contentFilter])
  const questionPages = Math.max(1, Math.ceil(filteredQuestions.length / 10))
  const currentQuestionPage = Math.min(questionPage, questionPages)
  const visibleQuestions = filteredQuestions.slice((currentQuestionPage - 1) * 10, currentQuestionPage * 10)
  const hasQuestionFilters = Boolean(search || levelFilter || contentFilter || contentFilterQuery)
  function clearQuestionFilters() { setSearch(""); setLevelFilter(""); setContentFilter(""); setContentFilterQuery(""); setFilterMenuOpen(false); setQuestionPage(1) }
  const eligible = useMemo(() => questions.filter((q) => selectedContents.some((content) => q.contents.includes(content)) && q.itens.length >= 2 && q.itens.length <= 5), [questions, selectedContents])
  const targetStudents = students.filter((s) => s.active && (!classroomId || s.classroom_id === Number(classroomId)))
  const selectedQuestions = selectedIds.map((id) => questions.find((q) => q.id === id)).filter((q): q is Question => !!q)

  function selectRandom() {
    setError(""); setNotice(""); setDrawMessage(null)
    if (!selectedContents.length) { setDrawMessage({ text: "Selecione pelo menos um conteúdo para sortear as questões.", error: true }); return }
    if (!Number.isInteger(quantity) || quantity < 1) { setDrawMessage({ text: "Informe uma quantidade inteira maior que zero.", error: true }); return }
    const groups = [2, 3, 4, 5].map((size) => eligible.filter((q) => q.itens.length === size)).sort((a, b) => b.length - a.length)
    if (groups[0].length < quantity) { setDrawMessage({ text: `Não foi possível sortear ${quantity} questões. Há no máximo ${groups[0].length} com a mesma quantidade de alternativas nos conteúdos selecionados. Reduza a quantidade ou selecione outros conteúdos.`, error: true }); return }
    const pool = [...groups[0]]
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]] }
    setSelectedIds(pool.slice(0, quantity).map((q) => q.id))
    setSelectionFromAnalysis(false)
    setDrawMessage({ text: `${quantity} questão(ões) sorteada(s). Confira a seleção abaixo antes de gerar a prova.`, error: false })
  }

  async function suggestReinforcement() {
    setError(""); setNotice(""); setDrawMessage(null); setSelectedIds([]); setSelectionFromAnalysis(false)
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) { setDrawMessage({ text: "Informe uma quantidade entre 1 e 100.", error: true }); return }
    const id = target === "turma" ? classroomId : studentId
    if (!id) { setDrawMessage({ text: target === "turma" ? "Selecione a turma nos dados da prova." : "Selecione o aluno nos dados da prova.", error: true }); return }
    setBusy("Buscando questões para reforço...")
    const response = await get<{ questions: { id: number; matched_contents: string[]; content_errors: number; bloom_errors: number }[]; unordered_attempts: number }>(`/${target === "turma" ? "classroom" : "student"}/${id}/reinforcement-suggestions?quantity=${quantity}`)
    if (response.statusCode === 200 && "questions" in response.responseBody) {
      const suggestion = response.responseBody
      const availableIds = new Set(questions.map((question) => question.id))
      if (suggestion.questions.some((question) => !availableIds.has(question.id))) {
        setDrawMessage({ text: "A lista de questões mudou. Recarregue a página antes de gerar a sugestão.", error: true })
      } else {
        setSelectedIds(suggestion.questions.map((question) => question.id))
        setSelectionFromAnalysis(true)
        const topics = [...new Set(suggestion.questions.flatMap((question) => question.matched_contents))]
        setDrawMessage({ text: `${suggestion.questions.length} questão(ões) sugerida(s) para reforçar: ${topics.join(", ")}. ${suggestion.unordered_attempts ? `${suggestion.unordered_attempts} resposta(s) antiga(s) foram desconsideradas por não terem ordem confirmada. ` : ""}Confira a lista; para alterar, use Selecionar manualmente. Depois, clique em Criar aplicação e gerar PDF.`, error: false })
      }
    } else setDrawMessage({ text: getError(response.responseBody, "Não foi possível sugerir questões."), error: true })
    setBusy("")
  }

  async function confirmOrder() {
    if (!orderExam || !orderVerified) return
    setBusy("Salvando ordem confirmada..."); setError(""); setNotice("")
    const response = await put<Exam>(`/test/applications/${orderExam.id}/question-order`, { questions: orderIds })
    if (response.statusCode === 200 && "id" in response.responseBody) {
      const updated = response.responseBody
      setApplications((previous) => previous.map((exam) => exam.id === updated.id ? updated : exam))
      setOrderExam(null); setOrderVerified(false); setNotice("Ordem registrada. A aplicação agora pode ser usada na geração e nas análises.")
    } else setError(getError(response.responseBody, "Não foi possível registrar a ordem."))
    setBusy("")
  }

  function clearAnalysisSelection() {
    if (selectionFromAnalysis) { setSelectedIds([]); setSelectionFromAnalysis(false); setDrawMessage(null) }
  }

  async function download(id: number) {
    setBusy("Preparando os PDFs..."); setError("")
    const result = await downloadFile(`/test/applications/${id}/generate`, `prova-${id}.zip`)
    if (result.statusCode !== 200) setError("Não foi possível gerar os PDFs. Confira se a turma possui alunos ativos e tente novamente.")
    else setNotice("Download iniciado. O arquivo ZIP contém a prova e o gabarito de cada aluno.")
    setBusy("")
  }

  async function createExam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("")
    if (!name.trim() || !theme.trim()) { setError("Informe o nome e o tema da prova."); return }
    if (!selectedQuestions.length && mode === "reforco") {
      questionSelectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      await suggestReinforcement()
      return
    }
    if (!selectedQuestions.length) { setError("Selecione pelo menos uma questão."); return }
    if (selectedQuestions.some((q) => q.itens.length < 2 || q.itens.length > 5 || q.itens.length !== selectedQuestions[0].itens.length)) { setError("Todas as questões devem ter a mesma quantidade de alternativas, entre 2 e 5, para gerar o gabarito."); return }
    if ((target === "turma" && !classroomId) || (target === "individual" && !studentId)) { setError("Selecione a turma ou o aluno da aplicação."); return }
    if (target === "turma" && !students.some((s) => s.active && s.classroom_id === Number(classroomId))) { setError("A turma selecionada não possui alunos ativos."); return }
    setLocked(true)
    let currentTemplateId = templateId
    if (!currentTemplateId) {
      setBusy("Criando modelo de prova...")
      const response = await post<Exam>("/test/", { name: name.trim(), theme: theme.trim(), questions: selectedIds, visibility: "private" })
      if (response.statusCode !== 200 || !("id" in response.responseBody)) { setError(`${getError(response.responseBody, "Não foi possível criar o modelo.")} Confira a biblioteca antes de tentar novamente, pois o resultado pode não ter sido confirmado.`); setBusy(""); return }
      currentTemplateId = response.responseBody.id; setTemplateId(currentTemplateId)
    }
    let currentApplicationId = applicationId
    if (!currentApplicationId) {
      setBusy("Criando aplicação...")
      const payload = target === "turma" ? { target_type: target, classroom_id: Number(classroomId), application_date: date || null } : { target_type: target, student_id: Number(studentId), application_date: date || null }
      const response = await post<Exam>(`/test/${currentTemplateId}/apply`, payload)
      if (response.statusCode !== 200 || !("id" in response.responseBody)) { setError(`${getError(response.responseBody, "Não foi possível criar a aplicação.")} Modelo ${currentTemplateId} salvo; confira as aplicações antes de tentar novamente.`); setBusy(""); return }
      const created = response.responseBody
      currentApplicationId = created.id; setApplicationId(created.id); setApplications((previous) => [created, ...previous])
    }
    setBusy(""); await download(currentApplicationId)
  }

  function reset() { setLocked(false); setTemplateId(null); setApplicationId(null); setName(""); setTheme(""); setDate(""); setSelectedIds([]); setSelectionFromAnalysis(false); setDrawMessage(null); setNotice(""); setError("") }

  return <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
    <div><h1 className="text-3xl font-semibold">Gerar provas</h1><p className="mt-2 text-muted-foreground">Selecione questões, sorteie por conteúdo ou gere uma seleção com base nos erros de uma turma ou aluno.</p></div>
    {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</p>}
    {notice && <p role="status" className="rounded-md border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800">{notice}</p>}
    {loading ? <p>Carregando dados...</p> : <form onSubmit={createExam} className="space-y-6">
      <fieldset disabled={locked || !!busy} className="space-y-6 disabled:opacity-70">
        <Card><CardHeader><CardTitle>Dados da prova</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><label className="space-y-2 text-sm font-medium">Nome<Input value={name} onChange={(e) => setName(e.target.value)} required /></label><label className="space-y-2 text-sm font-medium">Tema<Input value={theme} onChange={(e) => setTheme(e.target.value)} required /></label><label className="space-y-2 text-sm font-medium">Data de aplicação (opcional)<Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label><label className="space-y-2 text-sm font-medium">Aplicar para<select className={selectClass} value={target} onChange={(e) => { setTarget(e.target.value as "turma" | "individual"); setStudentId(""); clearAnalysisSelection() }}><option value="turma">Turma</option><option value="individual">Aluno</option></select></label><label className="space-y-2 text-sm font-medium">Turma<select className={selectClass} value={classroomId} onChange={(e) => { setClassroomId(e.target.value); setStudentId(""); clearAnalysisSelection() }} required={target === "turma"}><option value="">{target === "turma" ? "Selecione uma turma" : "Todas as turmas"}</option>{classrooms.filter((c) => c.active).map((c) => <option key={c.id} value={c.id}>{c.name} — {c.school_year}</option>)}</select></label>{target === "individual" && <label className="space-y-2 text-sm font-medium">Aluno<select className={selectClass} value={studentId} onChange={(e) => { setStudentId(e.target.value); clearAnalysisSelection() }} required><option value="">Selecione um aluno</option>{targetStudents.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.registration}</option>)}</select></label>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Questões</CardTitle><CardDescription>Para o gabarito, todas as questões da prova precisam ter a mesma quantidade de alternativas, de 2 a 5.</CardDescription></CardHeader><CardContent className="space-y-4"><fieldset className="flex flex-wrap gap-5"><legend className="sr-only">Forma de seleção</legend><label className="flex items-center gap-2 text-sm"><input type="radio" name="mode" checked={mode === "manual"} onChange={() => { setMode("manual"); setDrawMessage(null) }} />Selecionar manualmente</label><label className="flex items-center gap-2 text-sm"><input type="radio" name="mode" checked={mode === "automatico"} onChange={() => { setMode("automatico"); setSelectedIds([]); setSelectionFromAnalysis(false); setDrawMessage(null) }} />Sortear por conteúdo</label><label className="flex items-center gap-2 text-sm"><input type="radio" name="mode" checked={mode === "reforco"} onChange={() => { setMode("reforco"); setSelectedIds([]); setSelectionFromAnalysis(false); setDrawMessage(null) }} />Gerar pelos erros</label></fieldset>
        {mode === "manual" ? <>
          <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
            <label className="space-y-2 text-sm font-medium">Pesquisar<div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Enunciado, conteúdo ou ID" value={search} onChange={(e) => { setSearch(e.target.value); setQuestionPage(1) }} /></div></label>
            <label className="space-y-2 text-sm font-medium">Nível de Bloom<select className={selectClass} value={levelFilter} onChange={(e) => { setLevelFilter(e.target.value); setQuestionPage(1) }}><option value="">Todos os níveis</option>{levels.map((level, index) => <option key={level} value={index}>{index === 0 ? level : `${index} — ${level}`}</option>)}</select></label>
            <div className="relative space-y-2" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFilterMenuOpen(false) }}><label htmlFor="exam-content-filter" className="text-sm font-medium">Conteúdo</label><Input id="exam-content-filter" autoComplete="off" placeholder="Pesquisar conteúdo" value={contentFilterQuery} aria-expanded={filterMenuOpen} aria-controls="exam-content-options" onFocus={() => setFilterMenuOpen(true)} onChange={(e) => { setContentFilterQuery(e.target.value); setContentFilter(""); setFilterMenuOpen(true); setQuestionPage(1) }} onKeyDown={(e) => { if (e.key === "Escape") setFilterMenuOpen(false); if (e.key === "Enter") e.preventDefault() }} />{filterMenuOpen && <div id="exam-content-options" className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-md"><button type="button" className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent" onClick={() => { setContentFilter(""); setContentFilterQuery(""); setFilterMenuOpen(false); setQuestionPage(1) }}>Todos os conteúdos</button>{questionContents.filter((content) => normalize(content).includes(normalize(contentFilterQuery.trim()))).map((content) => <button type="button" key={content} className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent" onClick={() => { setContentFilter(content); setContentFilterQuery(content); setFilterMenuOpen(false); setQuestionPage(1) }}>{content}</button>)}{!questionContents.some((content) => normalize(content).includes(normalize(contentFilterQuery.trim()))) && <p className="px-3 py-2 text-sm text-muted-foreground">Nenhum conteúdo encontrado.</p>}</div>}</div>
            <Button type="button" variant="outline" disabled={!hasQuestionFilters} onClick={clearQuestionFilters}>Limpar filtros</Button>
          </div>
          <p className="text-sm text-muted-foreground" aria-live="polite">{filteredQuestions.length} de {questions.length} questão(ões) · {selectedIds.length} selecionada(s)</p>
          <div className="max-h-96 space-y-2 overflow-y-auto rounded-md border p-3">{visibleQuestions.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma questão encontrada.</p> : visibleQuestions.map((q) => <label key={q.id} className="flex cursor-pointer items-start gap-3 rounded p-2 hover:bg-muted"><input type="checkbox" className="mt-1" checked={selectedIds.includes(q.id)} onChange={(e) => setSelectedIds((ids) => e.target.checked ? [...ids, q.id] : ids.filter((id) => id !== q.id))} /><span><span className="block text-sm font-medium">{q.enunciation}</span><span className="text-xs text-muted-foreground">ID {q.id} · {levels[q.level] ?? `Nível ${q.level}`} · {q.contents.join(", ")} · {q.itens.length} alternativas</span></span></label>)}</div>
          {filteredQuestions.length > 0 && <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground"><span>Página {currentQuestionPage} de {questionPages}</span><div className="flex gap-2"><Button type="button" variant="outline" size="sm" disabled={currentQuestionPage === 1} onClick={() => setQuestionPage(currentQuestionPage - 1)}>Anterior</Button><Button type="button" variant="outline" size="sm" disabled={currentQuestionPage === questionPages} onClick={() => setQuestionPage(currentQuestionPage + 1)}>Próxima</Button></div></div>}
        </> : mode === "automatico" ? <><label className="block space-y-2 text-sm font-medium">Buscar conteúdos<Input value={contentSearch} onChange={(e) => setContentSearch(e.target.value)} placeholder="Digite o nome do conteúdo" /></label><div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">{contents.filter((c) => normalize(c.name).includes(normalize(contentSearch))).map((c) => <label key={c.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedContents.includes(c.name)} onChange={(e) => { setSelectedContents((old) => e.target.checked ? [...old, c.name] : old.filter((name) => name !== c.name)); setSelectedIds([]); setDrawMessage(null) }} />{c.name}</label>)}</div><div className="flex flex-wrap items-end gap-3"><label className="space-y-2 text-sm font-medium">Quantidade de questões<Input className="w-32" type="number" min="1" value={quantity} onChange={(e) => { setQuantity(Number(e.target.value)); setSelectedIds([]); setDrawMessage(null) }} /></label><Button type="button" variant="outline" onClick={selectRandom}>Sortear questões</Button></div>{drawMessage && <p role={drawMessage.error ? "alert" : "status"} className={drawMessage.error ? "rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" : "rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800"}>{drawMessage.text}</p>}<p className="text-xs text-muted-foreground">O sorteio considera questões que tenham pelo menos um dos conteúdos selecionados. {eligible.length} questão(ões) elegível(is).</p></> : <div ref={questionSelectionRef} className="space-y-4">
          <p className="text-sm text-muted-foreground">O sistema seleciona questões existentes com base nos conteúdos com mais erros e nos níveis de Bloom do histórico da turma ou do aluno escolhido. Selecione as questões e confira a lista antes de gerar a prova.</p>
          <div className="flex flex-wrap items-end gap-3"><label className="space-y-2 text-sm font-medium">Quantidade de questões<Input className="w-32" type="number" min="1" max="100" value={quantity} onChange={(e) => { setQuantity(Number(e.target.value)); setSelectedIds([]); setSelectionFromAnalysis(false); setDrawMessage(null) }} /></label><Button type="button" variant="outline" onClick={suggestReinforcement}>Selecionar pelos erros</Button></div>
          {busy && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />{busy}</p>}
          {drawMessage && <p role={drawMessage.error ? "alert" : "status"} className={drawMessage.error ? "rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" : "rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800"}>{drawMessage.text}</p>}
        </div>}
        <div className="rounded-md bg-muted p-3 text-sm"><p className="font-medium">{selectedQuestions.length} questão(ões) selecionada(s)</p>{selectedQuestions.length > 0 && <ol className="mt-2 max-h-48 list-inside list-decimal space-y-1 overflow-y-auto">{selectedQuestions.map((q) => <li key={q.id}>{q.enunciation}</li>)}</ol>}</div></CardContent></Card>
      </fieldset>
      {busy && <p role="status" className="flex items-center gap-2 text-sm"><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />{busy}</p>}
      {locked && <p className="text-sm text-muted-foreground">{templateId ? `Modelo ${templateId} criado.` : "Não foi possível confirmar a criação do modelo."} {applicationId ? `Aplicação ${applicationId} criada.` : ""} Confira a lista de aplicações antes de criar novamente após uma falha.</p>}
      <div className="flex flex-wrap gap-3"><Button type="submit" disabled={!!busy || loading || (locked && !templateId)}>{applicationId ? "Baixar novamente" : templateId ? "Continuar aplicação e gerar PDF" : "Criar aplicação e gerar PDF"}</Button>{locked && <Button type="button" variant="outline" disabled={!!busy} onClick={reset}>Iniciar outra prova</Button>}</div>
    </form>}
    {orderExam && <Card><CardHeader><CardTitle>Confirmar ordem da aplicação {orderExam.id}</CardTitle><CardDescription>A ordem original não foi registrada. Consulte a prova efetivamente aplicada e ajuste a lista para a mesma sequência; não confirme por suposição.</CardDescription></CardHeader><CardContent className="space-y-3"><ol className="space-y-2">{orderIds.map((id, index) => <li key={id} className="flex flex-wrap items-center gap-2 rounded border p-3"><span className="flex-1 text-sm">{index + 1}. {orderExam.questions.find((question) => question.id === id)?.enunciation}</span><Button type="button" size="sm" variant="outline" disabled={!!busy || index === 0} aria-label={`Subir questão ${index + 1}`} onClick={() => setOrderIds((old) => { const next = [...old]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next })}>Subir</Button><Button type="button" size="sm" variant="outline" disabled={!!busy || index === orderIds.length - 1} aria-label={`Descer questão ${index + 1}`} onClick={() => setOrderIds((old) => { const next = [...old]; [next[index], next[index + 1]] = [next[index + 1], next[index]]; return next })}>Descer</Button></li>)}</ol><label className="flex gap-2 text-sm"><input type="checkbox" checked={orderVerified} onChange={(e) => setOrderVerified(e.target.checked)} />Conferi a sequência com a prova aplicada.</label><div className="flex gap-2"><Button type="button" disabled={!orderVerified || !!busy} onClick={confirmOrder}>Confirmar ordem</Button><Button type="button" variant="outline" disabled={!!busy} onClick={() => setOrderExam(null)}>Cancelar</Button></div></CardContent></Card>}
    <Card><CardHeader><CardTitle>Aplicações de prova</CardTitle><CardDescription>Baixe novamente os PDFs das aplicações acessíveis.</CardDescription></CardHeader><CardContent>{applications.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma aplicação disponível.</p> : <div className="space-y-3">{applications.map((exam) => <div key={exam.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-4"><div><p className="font-medium">{exam.name}</p><p className="text-sm text-muted-foreground">{exam.theme} · {exam.target_type === "turma" ? `Turma: ${classrooms.find((c) => c.id === exam.classroom_id)?.name ?? exam.classroom_id}` : `Aluno: ${students.find((s) => s.id === exam.student_id)?.name ?? exam.student_id}`} · ID {exam.id}</p></div>{exam.question_order_confirmed ? <Button type="button" variant="outline" disabled={!!busy} onClick={() => download(exam.id)}>Baixar PDFs</Button> : <Button type="button" variant="outline" disabled={!!busy} onClick={() => { setOrderExam(exam); setOrderIds(exam.questions.map((question) => question.id)); setOrderVerified(false) }}>Conferir ordem</Button>}</div>)}</div>}</CardContent></Card>
  </main>
}
