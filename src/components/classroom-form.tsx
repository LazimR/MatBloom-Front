"use client"

import { FormEvent, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { post, put } from "@/services/request/Index"

export type ClassroomData = {
  id: number
  name: string
  school_year: number
  grade_level: string
  shift: string
  active: boolean
  teachers: { id: number; username: string; email: string }[]
  students: { id: number; name: string }[]
}

const shifts = [
  ["manha", "Manhã"], ["tarde", "Tarde"], ["noite", "Noite"],
  ["integral", "Integral"], ["matutino_vespertino", "Matutino/Vespertino"],
]

type Props = { classroom?: ClassroomData; onSaved: (classroom: ClassroomData) => void; onCancel: () => void }

export function ClassroomForm({ classroom, onSaved, onCancel }: Props) {
  const [name, setName] = useState(classroom?.name ?? "")
  const [year, setYear] = useState(String(classroom?.school_year ?? new Date().getFullYear()))
  const [grade, setGrade] = useState(classroom?.grade_level ?? "")
  const [shift, setShift] = useState(classroom?.shift ?? "manha")
  const [active, setActive] = useState(classroom?.active ?? true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const schoolYear = Number(year)
    if (!name.trim() || !grade.trim() || !Number.isInteger(schoolYear) || schoolYear < 1900 || schoolYear > 2100) {
      setError("Informe o nome, a série e um ano letivo válido entre 1900 e 2100.")
      return
    }
    setBusy(true); setError("")
    const data = { name: name.trim(), school_year: schoolYear, grade_level: grade.trim(), shift, active }
    const result = classroom ? await put<ClassroomData>("/classroom/", { id: classroom.id, ...data }) : await post<ClassroomData>("/classroom/", data)
    if (result.statusCode === 200 && "id" in result.responseBody) onSaved(result.responseBody)
    else setError("error" in result.responseBody && typeof result.responseBody.error === "string" ? result.responseBody.error : "Não foi possível salvar a turma.")
    setBusy(false)
  }

  return <Card className="border-border/70"><CardHeader><CardTitle>{classroom ? "Editar turma" : "Nova turma"}</CardTitle><CardDescription>Informe os dados da turma.</CardDescription></CardHeader><CardContent><form onSubmit={save} className="grid gap-4 md:grid-cols-2">
    <label className="space-y-2 text-sm font-medium">Nome da turma<Input value={name} onChange={(event) => setName(event.target.value)} required /></label>
    <label className="space-y-2 text-sm font-medium">Ano letivo<Input type="number" min="1900" max="2100" value={year} onChange={(event) => setYear(event.target.value)} required /></label>
    <label className="space-y-2 text-sm font-medium">Série ou ano escolar<Input placeholder="Ex.: 9º ano" value={grade} onChange={(event) => setGrade(event.target.value)} required /></label>
    <label className="space-y-2 text-sm font-medium">Turno<select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={shift} onChange={(event) => setShift(event.target.value)}>{shifts.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />Turma ativa</label>
    {error && <p role="alert" className="text-sm text-destructive md:col-span-2">{error}</p>}
    <div className="flex gap-3 md:col-span-2"><Button type="submit" disabled={busy}>{busy ? "Salvando..." : classroom ? "Salvar alterações" : "Cadastrar turma"}</Button><Button type="button" variant="outline" disabled={busy} onClick={onCancel}>Cancelar</Button></div>
  </form></CardContent></Card>
}
