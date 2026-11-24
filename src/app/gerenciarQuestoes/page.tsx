"use client"

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { LoaderCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { get, patch, post } from "@/services/request/Index"

type QuestionInput = { enunciation: string; itens: string[]; correct_item: number; contents: string[]; dependencies: number[] }
type Question = QuestionInput & { id: number; level: number }
const levels = ["Não classificado", "Lembrar", "Entender", "Aplicar", "Analisar", "Avaliar", "Criar"]
const PAGE_SIZE = 10
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
const inputClass = "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
const example = `{
  "enunciation": "Quanto é 2 + 2?",
  "itens": ["3", "4", "5"],
  "correct_item": 1,
  "contents": ["Adição"],
  "dependencies": []
}`

function questionKey(question: QuestionInput): string {
  return JSON.stringify([question.enunciation, question.itens, question.correct_item])
}

function validateQuestion(value: unknown, index: number): QuestionInput {
  const prefix = `Questão ${index + 1}`
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${prefix}: esperado um objeto.`)
  const q = value as Record<string, unknown>
  if (typeof q.enunciation !== "string" || !q.enunciation.trim()) throw new Error(`${prefix}: informe um enunciado.`)
  if (!Array.isArray(q.itens) || q.itens.length < 2 || q.itens.some((item) => typeof item !== "string" || !item.trim())) throw new Error(`${prefix}: informe ao menos duas alternativas não vazias em itens.`)
  if (!Number.isInteger(q.correct_item) || (q.correct_item as number) < 0 || (q.correct_item as number) >= q.itens.length) throw new Error(`${prefix}: correct_item deve ser o índice válido da alternativa correta, começando em 0.`)
  const contents = q.contents ?? []
  const dependencies = q.dependencies ?? []
  if (!Array.isArray(contents) || contents.some((item) => typeof item !== "string" || !item.trim())) throw new Error(`${prefix}: contents deve ser uma lista de nomes de conteúdos.`)
  if (!Array.isArray(dependencies) || dependencies.some((item) => !Number.isInteger(item) || item <= 0)) throw new Error(`${prefix}: dependencies deve ser uma lista de IDs positivos.`)
  const cleanContents = (contents as string[]).map((item) => item.trim())
  if (cleanContents.length === 0) throw new Error(`${prefix}: informe ao menos um conteúdo para classificação automática.`)
  if (new Set(cleanContents).size !== cleanContents.length || new Set(dependencies).size !== dependencies.length) throw new Error(`${prefix}: remova conteúdos ou dependências repetidos.`)
  return { enunciation: q.enunciation.trim(), itens: (q.itens as string[]).map((item) => item.trim()), correct_item: q.correct_item as number, contents: cleanContents, dependencies: dependencies as number[] }
}

export default function ManageQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [search, setSearch] = useState("")
  const [levelFilter, setLevelFilter] = useState("")
  const [contentFilter, setContentFilter] = useState("")
  const [contentFilterQuery, setContentFilterQuery] = useState("")
  const [filterMenuOpen, setFilterMenuOpen] = useState(false)
  const [contentMenuOpen, setContentMenuOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<{ mode: "manual" | "import"; done: number; total: number } | null>(null)
  const [enunciation, setEnunciation] = useState("")
  const [items, setItems] = useState(["", "", "", ""])
  const [correct, setCorrect] = useState("0")
  const [contentQuery, setContentQuery] = useState("")
  const [selectedContents, setSelectedContents] = useState<string[]>([])
  const [availableContents, setAvailableContents] = useState<string[]>([])
  const [contentError, setContentError] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editedLevel, setEditedLevel] = useState("1")
  const [file, setFile] = useState<File | null>(null)
  const [fileKey, setFileKey] = useState(0)

  const loadQuestions = useCallback(async () => {
    const response = await get<Question[]>("/question/all_questions")
    if (response.statusCode === 200 && Array.isArray(response.responseBody)) { setQuestions(response.responseBody); return true }
    if (response.statusCode === 404 && "error" in response.responseBody && response.responseBody.error === "Não há nenhuma questão cadastrada.") { setQuestions([]); return true }
    setError("error" in response.responseBody && typeof response.responseBody.error === "string" ? response.responseBody.error : "Não foi possível carregar as questões.")
    return false
  }, [])
  useEffect(() => { let active = true; async function load() { if (active) { await loadQuestions(); if (active) setLoading(false) } }; load(); return () => { active = false } }, [loadQuestions])

  useEffect(() => {
    let active = true
    async function loadContents() {
      const response = await get<{ id: number; name: string }[]>("/content/")
      if (!active) return
      if (response.statusCode === 200 && Array.isArray(response.responseBody)) {
        setAvailableContents(response.responseBody.map((content) => content.name))
      } else {
        setContentError("Não foi possível carregar os conteúdos cadastrados. Você ainda pode digitá-los.")
      }
    }
    loadContents()
    return () => { active = false }
  }, [])

  function addContent() {
    const typed = contentQuery.trim()
    if (!typed) return
    const match = availableContents.find((name) => normalize(name) === normalize(typed)) ?? typed
    setSelectedContents((current) => current.some((name) => normalize(name) === normalize(match)) ? current : [...current, match])
    setContentQuery("")
  }

  const contentOptions = useMemo(() => [...new Set(questions.flatMap((q) => q.contents))].sort((a, b) => a.localeCompare(b, "pt-BR")), [questions])
  const filteredQuestions = useMemo(() => {
    const term = normalize(search.trim())
    return questions.filter((q) => {
      const matchesSearch = !term || normalize(`${q.id} ${q.enunciation} ${q.contents.join(" ")}`).includes(term)
      return matchesSearch && (levelFilter === "" || q.level === Number(levelFilter)) && (contentFilter === "" || q.contents.includes(contentFilter))
    })
  }, [questions, search, levelFilter, contentFilter])
  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visibleQuestions = filteredQuestions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const hasFilters = Boolean(search || levelFilter || contentFilter || contentFilterQuery)
  function clearFilters() { setSearch(""); setLevelFilter(""); setContentFilter(""); setContentFilterQuery(""); setFilterMenuOpen(false); setPage(1) }

  async function saveManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("")
    let payload: QuestionInput
    try { payload = validateQuestion({ enunciation, itens: items, correct_item: Number(correct), contents: [...selectedContents, ...(contentQuery.trim() && !selectedContents.some((name) => normalize(name) === normalize(contentQuery.trim())) ? [availableContents.find((name) => normalize(name) === normalize(contentQuery.trim())) ?? contentQuery.trim()] : [])], dependencies: [] }, 0) }
    catch (err) { setError(err instanceof Error ? err.message : "Dados inválidos."); return }
    const duplicate = questions.find((question) => questionKey(question) === questionKey(payload))
    if (duplicate) { setError(`Esta questão já está cadastrada (ID ${duplicate.id}).`); return }
    setBusy(true)
    setProgress({ mode: "manual", done: 0, total: 1 })
    const response = await post<Question>("/question/", payload)
    if (response.statusCode === 200 && "id" in response.responseBody) {
      setEnunciation(""); setItems(["", "", "", ""]); setCorrect("0"); setSelectedContents([]); setContentQuery(""); setAvailableContents((current) => [...new Set([...current, ...payload.contents])])
      if (await loadQuestions()) setMessage("Questão cadastrada com sucesso.")
    } else if ((response.statusCode === 409 || response.statusCode === 422 || response.statusCode === 503) && "error" in response.responseBody && typeof response.responseBody.error === "string") setError(response.responseBody.error)
    else setError("Não foi possível confirmar o cadastro. Confira a lista antes de tentar novamente, pois a questão pode ter sido salva.")
    setProgress(null)
    setBusy(false)
  }

  async function saveLevel(id: number) {
    setBusy(true); setError(""); setMessage("")
    const response = await patch<Question>(`/question/${id}/level`, { level: Number(editedLevel) })
    if (response.statusCode === 200 && "id" in response.responseBody) {
      const updated = response.responseBody
      setQuestions((old) => old.map((q) => q.id === id ? updated : q))
      setEditingId(null); setMessage("Nível de Bloom atualizado.")
    } else setError("Não foi possível atualizar o nível. Recarregue a lista antes de tentar novamente.")
    setBusy(false)
  }

  async function importFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("")
    if (!file) { setError("Selecione um arquivo JSON."); return }
    let parsed: unknown
    try { parsed = JSON.parse(await file.text()) } catch { setError("Arquivo JSON inválido. Verifique a formatação."); return }
    const data = parsed && typeof parsed === "object" && !Array.isArray(parsed) && "questions" in parsed ? (parsed as { questions: unknown }).questions : parsed
    const raw = Array.isArray(data) ? data : [data]
    if (!raw.length) { setError("O arquivo não contém questões."); return }
    let batch: QuestionInput[]
    try { batch = raw.map(validateQuestion) } catch (err) { setError(err instanceof Error ? err.message : "Dados inválidos."); return }
    const knownQuestions = new Map(questions.map((question) => [questionKey(question), question.id]))
    const seen = new Set<string>()
    for (let index = 0; index < batch.length; index++) {
      const key = questionKey(batch[index])
      const existingId = knownQuestions.get(key)
      if (existingId !== undefined) { setError(`Questão ${index + 1} do arquivo já está cadastrada (ID ${existingId}). Nenhuma questão foi enviada.`); return }
      if (seen.has(key)) { setError(`Questão ${index + 1} está repetida no arquivo. Nenhuma questão foi enviada.`); return }
      seen.add(key)
    }
    const knownIds = new Set(questions.map((q) => q.id))
    const unknown = batch.flatMap((q) => q.dependencies).find((id) => !knownIds.has(id))
    if (unknown !== undefined) { setError(`A dependência ${unknown} não foi encontrada entre as questões cadastradas. Atualize a página e confira os IDs.`); return }
    setBusy(true)
    setProgress({ mode: "import", done: 0, total: batch.length })
    let saved = 0
    let duplicateMessage = ""
    for (const question of batch) {
      const response = await post<Question>("/question/", question)
      if (response.statusCode !== 200 || !("id" in response.responseBody)) {
        if (response.statusCode === 409 && "error" in response.responseBody && typeof response.responseBody.error === "string") duplicateMessage = response.responseBody.error
        break
      }
      saved++
      setProgress({ mode: "import", done: saved, total: batch.length })
    }
    setFile(null); setFileKey((key) => key + 1)
    if (saved === batch.length) { if (await loadQuestions()) setMessage(`${saved} questão(ões) importada(s) com sucesso.`) }
    else { await loadQuestions(); setError(duplicateMessage ? `${saved} de ${batch.length} questões adicionadas. Questão ${saved + 1}: ${duplicateMessage} A importação foi interrompida.` : `${saved} de ${batch.length} questões confirmadas. A importação parou na questão ${saved + 1}; ela pode ter sido salva parcialmente. Confira a lista antes de importar as restantes para evitar duplicatas.`) }
    setProgress(null)
    setBusy(false)
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
      <div><h1 className="text-3xl font-semibold tracking-tight">Questões</h1><p className="mt-2 text-muted-foreground">Cadastre questões individuais ou importe um arquivo JSON.</p></div>
      {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</p>}
      {message && <p role="status" className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800">{message}</p>}
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Nova questão</CardTitle><CardDescription>Informe o enunciado, as alternativas e a resposta correta.</CardDescription></CardHeader><CardContent>
          <form onSubmit={saveManual} className="space-y-4">
            <div className="space-y-2"><label htmlFor="enunciation" className="text-sm font-medium">Enunciado</label><textarea id="enunciation" className={`${inputClass} min-h-28`} required value={enunciation} onChange={(e) => setEnunciation(e.target.value)} /></div>
            <fieldset className="space-y-2"><legend className="mb-2 text-sm font-medium">Alternativas</legend>{items.map((item, index) => <div className="flex items-center gap-2" key={index}><label className="w-7 text-sm" htmlFor={`item-${index}`}>{String.fromCharCode(65 + index)}.</label><Input id={`item-${index}`} required value={item} onChange={(e) => setItems((old) => old.map((v, i) => i === index ? e.target.value : v))} />{items.length > 2 && <Button type="button" variant="ghost" size="sm" aria-label={`Remover alternativa ${String.fromCharCode(65 + index)}`} onClick={() => { setItems((old) => old.filter((_, i) => i !== index)); setCorrect("0") }}>Remover</Button>}</div>)}<Button type="button" variant="outline" size="sm" disabled={items.length >= 26} onClick={() => setItems((old) => [...old, ""])}>Adicionar alternativa</Button></fieldset>
            <div className="space-y-2"><label htmlFor="correct" className="text-sm font-medium">Alternativa correta</label><select id="correct" className={inputClass} value={correct} onChange={(e) => setCorrect(e.target.value)}>{items.map((_, i) => <option key={i} value={i}>{String.fromCharCode(65 + i)}</option>)}</select></div>
            <div className="space-y-2">
              <label htmlFor="contents" className="text-sm font-medium">Conteúdos</label>
              <div className="flex gap-2"><div className="relative flex-1" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setContentMenuOpen(false) }}><Input id="contents" autoComplete="off" placeholder="Digite para pesquisar conteúdos" value={contentQuery} disabled={busy} aria-expanded={contentMenuOpen} aria-controls="content-suggestions" onFocus={() => setContentMenuOpen(true)} onChange={(e) => { setContentQuery(e.target.value); setContentMenuOpen(true) }} onKeyDown={(e) => { if (e.key === "Enter" && contentQuery.trim()) { e.preventDefault(); addContent(); setContentMenuOpen(false) } else if (e.key === "Escape") setContentMenuOpen(false) }} />{contentMenuOpen && <div id="content-suggestions" className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-md">{availableContents.filter((name) => !selectedContents.some((selected) => normalize(selected) === normalize(name)) && normalize(name).includes(normalize(contentQuery.trim()))).sort((a, b) => a.localeCompare(b, "pt-BR")).map((name) => <button key={name} type="button" className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent" onClick={() => { setSelectedContents((current) => [...current, name]); setContentQuery(""); setContentMenuOpen(false) }}>{name}</button>)}{!availableContents.some((name) => !selectedContents.some((selected) => normalize(selected) === normalize(name)) && normalize(name).includes(normalize(contentQuery.trim()))) && <p className="px-3 py-2 text-sm text-muted-foreground">Nenhum conteúdo encontrado. Digite um novo e clique em Adicionar.</p>}</div>}</div><Button type="button" variant="outline" disabled={busy || !contentQuery.trim()} onClick={() => { addContent(); setContentMenuOpen(false) }}>Adicionar</Button></div>
              {selectedContents.length > 0 && <ul aria-label="Conteúdos selecionados" className="flex flex-wrap gap-2">{selectedContents.map((name) => <li key={name} className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm">{name}<button type="button" disabled={busy} className="ml-1 rounded px-1 hover:bg-muted" aria-label={`Remover ${name}`} onClick={() => setSelectedContents((current) => current.filter((item) => item !== name))}>×</button></li>)}</ul>}
              <p className="text-xs text-muted-foreground">Selecione ou digite um conteúdo e clique em Adicionar. Informe ao menos um; o nível de Bloom será classificado automaticamente.</p>
              {contentError && <p role="status" className="text-xs text-destructive">{contentError}</p>}
            </div>
            <Button type="submit" disabled={busy}>{progress?.mode === "manual" && <LoaderCircle aria-hidden="true" className="animate-spin" />}{progress?.mode === "manual" ? "Salvando..." : "Salvar questão"}</Button>
            {progress?.mode === "manual" && <p role="status" className="text-sm text-muted-foreground">Classificando e salvando a questão. Isso pode levar alguns instantes.</p>}
          </form>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Importar JSON</CardTitle><CardDescription>Selecione um objeto, uma lista ou um objeto com a chave questions.</CardDescription></CardHeader><CardContent><form onSubmit={importFile} className="space-y-4"><label htmlFor="file" className="text-sm font-medium">Arquivo de questões</label><Input key={fileKey} id="file" type="file" accept=".json,application/json" onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null)} /><p className="text-xs text-muted-foreground">A alternativa correta usa índice iniciado em 0: A = 0, B = 1. O nível de Bloom é classificado automaticamente, mesmo se o arquivo contiver level.</p><details><summary className="cursor-pointer text-sm font-medium">Ver exemplo de formato</summary><pre className="mt-3 overflow-x-auto rounded-md bg-muted p-3 text-xs">{example}</pre></details><Button type="submit" disabled={busy || loading || !file}>{progress?.mode === "import" && <LoaderCircle aria-hidden="true" className="animate-spin" />}{progress?.mode === "import" ? "Importando..." : "Importar questões"}</Button>{progress?.mode === "import" && <div role="status" aria-live="polite" className="space-y-2 text-sm text-muted-foreground"><p>{progress.done} de {progress.total} questão(ões) adicionada(s). {progress.done < progress.total ? `Classificando questão ${progress.done + 1} de ${progress.total}...` : "Atualizando a lista..."}</p><progress className="h-2 w-full accent-teal-700" value={progress.done} max={progress.total} aria-label="Progresso da importação" /><p>A classificação pode levar alguns instantes. Mantenha esta página aberta.</p></div>}</form></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Questões cadastradas</CardTitle><CardDescription>Pesquise e filtre as questões disponíveis no sistema.</CardDescription></CardHeader><CardContent>
        <div className="mb-5 grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
          <div className="space-y-2"><label htmlFor="question-search" className="text-sm font-medium">Pesquisar</label><Input id="question-search" placeholder="Enunciado, conteúdo ou ID" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} /></div>
          <div className="space-y-2"><label htmlFor="filter-level" className="text-sm font-medium">Nível de Bloom</label><select id="filter-level" className={inputClass} value={levelFilter} onChange={(event) => { setLevelFilter(event.target.value); setPage(1) }}><option value="">Todos os níveis</option>{levels.map((name, index) => <option key={name} value={index}>{index === 0 ? name : `${index} — ${name}`}</option>)}</select></div>
          <div className="relative space-y-2" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFilterMenuOpen(false) }}><label htmlFor="filter-content" className="text-sm font-medium">Conteúdo</label><Input id="filter-content" autoComplete="off" placeholder="Pesquisar conteúdo" value={contentFilterQuery} aria-expanded={filterMenuOpen} aria-controls="filter-content-options" onFocus={() => setFilterMenuOpen(true)} onChange={(event) => { setContentFilterQuery(event.target.value); setContentFilter(""); setFilterMenuOpen(true); setPage(1) }} onKeyDown={(event) => { if (event.key === "Escape") setFilterMenuOpen(false); if (event.key === "Enter") event.preventDefault() }} />{filterMenuOpen && <div id="filter-content-options" className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-md"><button type="button" className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent" onClick={() => { setContentFilter(""); setContentFilterQuery(""); setFilterMenuOpen(false); setPage(1) }}>Todos os conteúdos</button>{contentOptions.filter((content) => normalize(content).includes(normalize(contentFilterQuery.trim()))).map((content) => <button key={content} type="button" className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent" onClick={() => { setContentFilter(content); setContentFilterQuery(content); setFilterMenuOpen(false); setPage(1) }}>{content}</button>)}{!contentOptions.some((content) => normalize(content).includes(normalize(contentFilterQuery.trim()))) && <p className="px-3 py-2 text-sm text-muted-foreground">Nenhum conteúdo encontrado.</p>}</div>}</div>
          <Button type="button" variant="outline" onClick={clearFilters} disabled={!hasFilters}>Limpar filtros</Button>
        </div>
        {loading ? <p className="text-sm text-muted-foreground">Carregando questões...</p> : questions.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma questão para exibir.</p> : filteredQuestions.length === 0 ? <p className="py-4 text-sm text-muted-foreground">Nenhuma questão encontrada para os filtros selecionados.</p> : <><p className="mb-4 text-sm text-muted-foreground" aria-live="polite">{filteredQuestions.length} de {questions.length} questão(ões)</p><div className="space-y-3">{visibleQuestions.map((q) => <div key={q.id} className="rounded-lg border p-4"><p className="font-medium">{q.enunciation}</p><p className="mt-2 text-sm text-muted-foreground">ID {q.id} · {levels[q.level] ?? `Nível ${q.level}`} · {q.contents.join(", ") || "Sem conteúdo"}</p>{editingId === q.id ? <div className="mt-3 flex flex-wrap items-center gap-2"><label htmlFor={`level-${q.id}`} className="text-sm">Corrigir nível</label><select id={`level-${q.id}`} className={`${inputClass} w-auto`} value={editedLevel} onChange={(e) => setEditedLevel(e.target.value)}>{levels.slice(1).map((name, i) => <option key={name} value={i + 1}>{i + 1} — {name}</option>)}</select><Button type="button" size="sm" disabled={busy} onClick={() => saveLevel(q.id)}>Salvar</Button><Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setEditingId(null)}>Cancelar</Button></div> : <Button type="button" variant="outline" size="sm" className="mt-3" disabled={busy} onClick={() => { setEditingId(q.id); setEditedLevel(String(q.level >= 1 && q.level <= 6 ? q.level : 1)) }}>Corrigir nível</Button>}<details className="mt-2 text-sm"><summary className="cursor-pointer">Ver alternativas</summary><ol className="mt-2 space-y-1">{q.itens.map((item, i) => <li key={i}>{String.fromCharCode(65 + i)}. {item}{i === q.correct_item ? " ✓" : ""}</li>)}</ol></details></div>)}</div><div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground"><span>Página {currentPage} de {totalPages}</span><div className="flex gap-2"><Button type="button" variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Anterior</Button><Button type="button" variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>Próxima</Button></div></div></>}</CardContent></Card>
    </main>
  )
}
