"use client"

import { FormEvent, useEffect, useState } from "react"
import { ShieldCheck, Users } from "lucide-react"

import { useAppSelector } from "@/hooks/Redux"
import { get, post } from "@/services/request/Index"
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

type AdminUser = {
  id: number
  username: string
  email: string
  role: string
}
type TeacherSummary = Omit<AdminUser, "role">

export default function ManageUsersPage() {
  const user = useAppSelector((state) => state.user)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [listError, setListError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newRole, setNewRole] = useState<"professor" | "diretor">("professor")
  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    password: "",
  })

  useEffect(() => {
    let isMounted = true

    async function loadUsers() {
      if (user.role !== "admin" && user.role !== "diretor") {
        setIsLoading(false)
        return
      }

      const response = await get<(AdminUser | TeacherSummary)[]>(user.role === "admin" ? "/user/" : "/user/directory/teachers")

      if (!isMounted) {
        return
      }

      if (response.statusCode !== 200 || !Array.isArray(response.responseBody)) {
        setListError(
          "error" in response.responseBody
            ? response.responseBody.error
            : "Não foi possível carregar os usuários."
        )
        setIsLoading(false)
        return
      }

      setUsers(response.responseBody.map((listedUser) => "role" in listedUser ? listedUser : { ...listedUser, role: "professor" }))
      setIsLoading(false)
    }

    loadUsers()

    return () => {
      isMounted = false
    }
  }, [user.role])

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")
    setIsSubmitting(true)

    const response = await post<AdminUser>("/user/", {
      username: userForm.username,
      email: userForm.email,
      password: userForm.password,
      role: user.role === "diretor" ? "professor" : newRole,
    })

    if (response.statusCode !== 200 || !("id" in response.responseBody)) {
      setErrorMessage(
        "error" in response.responseBody
          ? response.responseBody.error
          : "Não foi possível criar o usuário."
      )
      setIsSubmitting(false)
      return
    }

    const createdUser = response.responseBody
    setUsers((currentUsers) => [...currentUsers, createdUser])
    setUserForm({ username: "", email: "", password: "" })
    setSuccessMessage(`${createdUser.role === "diretor" ? "Diretor" : "Professor"} ${createdUser.username} criado com sucesso.`)
    setIsSubmitting(false)
  }

  if (user.role !== "admin" && user.role !== "diretor") {
    return (
      <div className="min-h-screen bg-muted/30">
        <main className="mx-auto max-w-4xl px-6 py-8">
          <Card className="border-amber-200 bg-amber-50/60">
            <CardHeader>
              <CardTitle className="text-amber-900">Acesso restrito</CardTitle>
              <CardDescription className="text-amber-800">
                Esta área é restrita a administradores e diretores.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    )
  }

  const directorUsers = users.filter((listedUser) => listedUser.role === "diretor")
  const teacherUsers = users.filter((listedUser) => listedUser.role === "professor")

  return (
    <div className="min-h-screen bg-muted/30">
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-3xl tracking-tight">Gerenciar Usuários</CardTitle>
            <CardDescription>
              {user.role === "admin" ? "Cadastre professores e diretores." : "Cadastre professores para a instituição."}
            </CardDescription>
          </CardHeader>
        </Card>

        <section className={user.role === "admin" ? "grid gap-6 xl:grid-cols-[1.1fr_1.4fr]" : "grid gap-6"}>
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>{user.role === "admin" ? "Criar usuário" : "Cadastrar professor"}</CardTitle>
              <CardDescription>
                {user.role === "admin" ? "Selecione o papel do novo usuário." : "Preencha os dados para criar o acesso do professor."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="space-y-3" onSubmit={handleCreateUser}>
                {user.role === "admin" && <label className="block space-y-2 text-sm font-medium">Papel<select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newRole} onChange={(event) => setNewRole(event.target.value as "professor" | "diretor")}><option value="professor">Professor</option><option value="diretor">Diretor</option></select></label>}
                <Input
                  aria-label="Nome de usuário"
                  placeholder="Nome de usuário"
                  value={userForm.username}
                  onChange={(event) =>
                    setUserForm((currentForm) => ({
                      ...currentForm,
                      username: event.target.value,
                    }))
                  }
                  required
                />
                <Input
                  type="email"
                  aria-label="Email institucional"
                  placeholder="Email institucional"
                  value={userForm.email}
                  onChange={(event) =>
                    setUserForm((currentForm) => ({
                      ...currentForm,
                      email: event.target.value,
                    }))
                  }
                  required
                />
                <Input
                  type="password"
                  aria-label="Senha inicial"
                  placeholder="Senha inicial"
                  value={userForm.password}
                  onChange={(event) =>
                    setUserForm((currentForm) => ({
                      ...currentForm,
                      password: event.target.value,
                    }))
                  }
                  required
                />
                <Button
                  type="submit"
                  className="w-full bg-teal-700 text-white hover:bg-teal-800"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Criando usuário..." : user.role === "diretor" || newRole === "professor" ? "Cadastrar professor" : "Cadastrar diretor"}
                </Button>
              </form>

              {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
              {successMessage ? <p className="text-sm text-teal-700">{successMessage}</p> : null}
              {(user.role === "diretor" || newRole === "professor") && <p className="text-xs text-muted-foreground">Após o cadastro, vincule o professor na página de detalhes da turma para liberar o acesso a ela.</p>}

              {user.role === "admin" && <div className="grid gap-3 sm:grid-cols-2">
                <MiniMetric
                  icon={ShieldCheck}
                  label="Diretores"
                  value={String(directorUsers.length)}
                />
                <MiniMetric
                  icon={Users}
                  label="Usuários totais"
                  value={String(users.length)}
                />
              </div>}
            </CardContent>
          </Card>

          {user.role === "admin" && <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Diretores cadastrados</CardTitle>
              <CardDescription>
                Lista atual dos usuários com papel diretor disponíveis no sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {listError ? (
                <p role="alert" className="text-sm text-destructive">{listError}</p>
              ) : isLoading ? (
                <p className="text-sm text-muted-foreground">Carregando usuários...</p>
              ) : directorUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum diretor encontrado.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {directorUsers.map((listedUser) => (
                      <TableRow key={listedUser.id}>
                        <TableCell>{listedUser.id}</TableCell>
                        <TableCell>{listedUser.username}</TableCell>
                        <TableCell>{listedUser.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>}
        </section>
        <Card className="border-border/70">
          <CardHeader><CardTitle>Professores cadastrados</CardTitle><CardDescription>Professores com acesso cadastrado no sistema.</CardDescription></CardHeader>
          <CardContent>
            {listError ? <p role="alert" className="text-sm text-destructive">{listError}</p> : isLoading ? <p className="text-sm text-muted-foreground">Carregando professores...</p> : teacherUsers.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum professor encontrado.</p> : <Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Usuário</TableHead><TableHead>Email</TableHead></TableRow></TableHeader><TableBody>{teacherUsers.map((teacher) => <TableRow key={teacher.id}><TableCell>{teacher.id}</TableCell><TableCell>{teacher.username}</TableCell><TableCell>{teacher.email}</TableCell></TableRow>)}</TableBody></Table>}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function MiniMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ShieldCheck
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className="rounded-full bg-teal-50 p-2 text-teal-700">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}
