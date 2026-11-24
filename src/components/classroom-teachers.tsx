"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { del, get, post } from "@/services/request/Index"
import type { ClassroomData } from "@/components/classroom-form"

type Teacher = { id: number; username: string; email: string }
type User = Teacher & { role: string }
type Props = { classroom: ClassroomData; onUpdated: (classroom: ClassroomData) => void }

function responseError(body: unknown, fallback: string) {
  return body && typeof body === "object" && "error" in body && typeof body.error === "string" ? body.error : fallback
}

export function ClassroomTeachers({ classroom, onUpdated }: Props) {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [needsRefresh, setNeedsRefresh] = useState(false)
  const [search, setSearch] = useState("")
  const [confirmRemoval, setConfirmRemoval] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  useEffect(() => {
    let active = true
    async function load() {
      const response = await get<Teacher[]>("/user/directory/teachers")
      if (!active) return
      if (response.statusCode === 200 && Array.isArray(response.responseBody)) {
        setTeachers(response.responseBody)
      } else setError(responseError(response.responseBody, "Não foi possível carregar os professores."))
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [])

  const available = useMemo(() => {
    const linked = new Set(classroom.teachers.map((teacher) => teacher.id))
    const term = search.trim().toLocaleLowerCase("pt-BR")
    return teachers.filter((teacher) => !linked.has(teacher.id) && `${teacher.username} ${teacher.email}`.toLocaleLowerCase("pt-BR").includes(term)).sort((a, b) => a.username.localeCompare(b.username, "pt-BR"))
  }, [teachers, classroom.teachers, search])

  async function refreshClassroom() {
    const result = await get<ClassroomData>(`/classroom/${classroom.id}`)
    if (result.statusCode === 200 && "id" in result.responseBody) {
      onUpdated(result.responseBody)
      setNeedsRefresh(false)
      return true
    }
    setNeedsRefresh(true)
    return false
  }

  async function changeLink(teacher: Teacher, action: "add" | "remove") {
    setBusy(true); setError(""); setNotice("")
    const url = `/user/${teacher.id}/classrooms/${classroom.id}`
    const response = action === "add" ? await post<User>(url, {}) : await del<User>(url)
    const updated = await refreshClassroom()
    setConfirmRemoval(null)
    if (response.statusCode === 200) {
      setNotice(`${teacher.username} ${action === "add" ? "foi vinculado(a) à turma" : "foi removido(a) da turma"}.${updated ? "" : " O vínculo foi alterado, mas a lista não pôde ser atualizada."}`)
    } else if (!updated) {
      setError("Não foi possível confirmar a alteração nem atualizar a turma. Atualize a lista antes de tentar novamente.")
    } else if (response.statusCode >= 500) {
      setError("Não foi possível confirmar a alteração. A lista da turma foi atualizada; confira o vínculo antes de tentar novamente.")
    } else {
      setError(responseError(response.responseBody, "Não foi possível alterar o vínculo. Confira a lista antes de tentar novamente."))
    }
    setBusy(false)
  }

  return <div className="space-y-5">
    {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
    {notice && <p role="status" className="rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">{notice}</p>}
    {needsRefresh && <Button type="button" variant="outline" disabled={busy} onClick={async () => { setBusy(true); if (await refreshClassroom()) { setError(""); setNotice("Lista da turma atualizada.") } else setError("Não foi possível atualizar a turma. Tente novamente."); setBusy(false) }}>Atualizar lista da turma</Button>}
    <div className="space-y-3"><h3 className="text-sm font-semibold">Vinculados</h3>{classroom.teachers.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum professor vinculado a esta turma.</p> : <ul className="space-y-2">{classroom.teachers.map((teacher) => <li key={teacher.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"><div><p className="text-sm font-medium">{teacher.username}</p><p className="text-xs text-muted-foreground">{teacher.email}</p></div>{confirmRemoval === teacher.id ? <div className="flex flex-wrap items-center gap-2"><span className="text-xs text-amber-800">O professor perderá o acesso a esta turma.</span><Button type="button" size="sm" variant="destructive" disabled={busy || needsRefresh} onClick={() => changeLink(teacher, "remove")}>Confirmar remoção</Button><Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setConfirmRemoval(null)}>Cancelar</Button></div> : <Button type="button" size="sm" variant="outline" disabled={busy || needsRefresh} aria-label={`Remover ${teacher.username} da turma`} onClick={() => setConfirmRemoval(teacher.id)}>Remover</Button>}</li>)}</ul>}</div>
    <div className="space-y-3"><h3 className="text-sm font-semibold">Vincular professor</h3><label htmlFor="teacher-search" className="sr-only">Pesquisar professor por usuário ou email</label><Input id="teacher-search" placeholder="Buscar por usuário ou email" value={search} onChange={(event) => setSearch(event.target.value)} />{loading ? <p className="text-sm text-muted-foreground">Carregando professores...</p> : available.length === 0 ? <p className="text-sm text-muted-foreground">{search.trim() ? "Nenhum professor disponível corresponde à busca." : "Nenhum professor disponível para vincular."}</p> : <ul className="max-h-64 space-y-2 overflow-y-auto">{available.map((teacher) => <li key={teacher.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"><div><p className="text-sm font-medium">{teacher.username}</p><p className="text-xs text-muted-foreground">{teacher.email}</p></div><Button type="button" size="sm" disabled={busy || needsRefresh} aria-label={`Vincular ${teacher.username} à turma`} onClick={() => changeLink(teacher, "add")}>Vincular</Button></li>)}</ul>}</div>
  </div>
}
