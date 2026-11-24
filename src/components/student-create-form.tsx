"use client"

import { FormEvent, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { post } from "@/services/request/Index"

export type StudentListItem = { id: number; name: string; registration: string; classroom_id: number; active: boolean }
export type StudentClassroomOption = { id: number; name: string; school_year: number; active: boolean }

type Props = { classrooms: StudentClassroomOption[]; initialClassroomId?: number; onSaved: (student: StudentListItem) => void; onCancel: () => void }

export function StudentCreateForm({ classrooms, initialClassroomId, onSaved, onCancel }: Props) {
  const [name, setName] = useState("")
  const [registration, setRegistration] = useState("")
  const [classroomId, setClassroomId] = useState(initialClassroomId ? String(initialClassroomId) : "")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const activeClassrooms = classrooms.filter((classroom) => classroom.active)

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim() || !registration.trim() || !activeClassrooms.some((classroom) => classroom.id === Number(classroomId))) {
      setError("Informe o nome, a matrícula e uma turma ativa.")
      return
    }
    setBusy(true); setError("")
    const response = await post<StudentListItem>("/student/", { name: name.trim(), registration: registration.trim(), classroom_id: Number(classroomId), active: true })
    if (response.statusCode === 200 && "id" in response.responseBody) onSaved(response.responseBody)
    else setError(response.statusCode === 409 ? "Esta matrícula já está cadastrada." : "error" in response.responseBody && typeof response.responseBody.error === "string" ? response.responseBody.error : "Não foi possível cadastrar o aluno.")
    setBusy(false)
  }

  return <Card className="border-border/70"><CardHeader><CardTitle>Cadastrar aluno</CardTitle><CardDescription>Preencha os dados e selecione uma turma ativa.</CardDescription></CardHeader><CardContent><form onSubmit={save} className="grid gap-4 md:grid-cols-2">
    <label className="space-y-2 text-sm font-medium">Nome do aluno<Input value={name} onChange={(event) => setName(event.target.value)} required /></label>
    <label className="space-y-2 text-sm font-medium">Matrícula<Input value={registration} onChange={(event) => setRegistration(event.target.value)} required /></label>
    <label className="space-y-2 text-sm font-medium md:col-span-2">Turma<select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={classroomId} onChange={(event) => setClassroomId(event.target.value)} required><option value="">Selecione uma turma</option>{activeClassrooms.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.name} — {classroom.school_year}</option>)}</select></label>
    {activeClassrooms.length === 0 && <p className="text-sm text-muted-foreground md:col-span-2">Cadastre ou ative uma turma antes de adicionar alunos.</p>}
    {error && <p role="alert" className="text-sm text-destructive md:col-span-2">{error}</p>}
    <div className="flex gap-3 md:col-span-2"><Button type="submit" disabled={busy || activeClassrooms.length === 0}>{busy ? "Salvando..." : "Cadastrar aluno"}</Button><Button type="button" variant="outline" disabled={busy} onClick={onCancel}>Cancelar</Button></div>
  </form></CardContent></Card>
}
