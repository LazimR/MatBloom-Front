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

export default function ManageUsersPage() {
  const user = useAppSelector((state) => state.user)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [directorForm, setDirectorForm] = useState({
    username: "",
    email: "",
    password: "",
  })

  useEffect(() => {
    let isMounted = true

    async function loadUsers() {
      if (user.role !== "admin") {
        setIsLoading(false)
        return
      }

      const response = await get<AdminUser[]>("/user/")

      if (!isMounted) {
        return
      }

      if (response.statusCode !== 200 || !Array.isArray(response.responseBody)) {
        setErrorMessage(
          "error" in response.responseBody
            ? response.responseBody.error
            : "Não foi possível carregar os usuários."
        )
        setIsLoading(false)
        return
      }

      setUsers(response.responseBody)
      setIsLoading(false)
    }

    loadUsers()

    return () => {
      isMounted = false
    }
  }, [user.role])

  async function handleCreateDirector(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")
    setIsSubmitting(true)

    const response = await post<AdminUser>("/user/", {
      username: directorForm.username,
      email: directorForm.email,
      password: directorForm.password,
      role: "diretor",
    })

    if (response.statusCode !== 200 || !("id" in response.responseBody)) {
      setErrorMessage(
        "error" in response.responseBody
          ? response.responseBody.error
          : "Não foi possível criar o diretor."
      )
      setIsSubmitting(false)
      return
    }

    setUsers((currentUsers) => [...currentUsers, response.responseBody])
    setDirectorForm({ username: "", email: "", password: "" })
    setSuccessMessage(`Diretor ${response.responseBody.username} criado com sucesso.`)
    setIsSubmitting(false)
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-muted/30">
        <main className="mx-auto max-w-4xl px-6 py-8">
          <Card className="border-amber-200 bg-amber-50/60">
            <CardHeader>
              <CardTitle className="text-amber-900">Acesso restrito</CardTitle>
              <CardDescription className="text-amber-800">
                Apenas administradores podem gerenciar usuários e criar diretores.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    )
  }

  const directorUsers = users.filter((listedUser) => listedUser.role === "diretor")

  return (
    <div className="min-h-screen bg-muted/30">
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-3xl tracking-tight">Gerenciar Usuários</CardTitle>
            <CardDescription>
              Área administrativa para criação de usuários com privilégio de diretor.
            </CardDescription>
          </CardHeader>
        </Card>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_1.4fr]">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Criar Diretor</CardTitle>
              <CardDescription>
                O papel é fixado como diretor para manter o fluxo incremental desta etapa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="space-y-3" onSubmit={handleCreateDirector}>
                <Input
                  placeholder="Nome de usuário"
                  value={directorForm.username}
                  onChange={(event) =>
                    setDirectorForm((currentForm) => ({
                      ...currentForm,
                      username: event.target.value,
                    }))
                  }
                  required
                />
                <Input
                  type="email"
                  placeholder="Email institucional"
                  value={directorForm.email}
                  onChange={(event) =>
                    setDirectorForm((currentForm) => ({
                      ...currentForm,
                      email: event.target.value,
                    }))
                  }
                  required
                />
                <Input
                  type="password"
                  placeholder="Senha inicial"
                  value={directorForm.password}
                  onChange={(event) =>
                    setDirectorForm((currentForm) => ({
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
                  {isSubmitting ? "Criando diretor..." : "Criar usuário diretor"}
                </Button>
              </form>

              {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
              {successMessage ? <p className="text-sm text-teal-700">{successMessage}</p> : null}

              <div className="grid gap-3 sm:grid-cols-2">
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
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Diretores cadastrados</CardTitle>
              <CardDescription>
                Lista atual dos usuários com papel diretor disponíveis no sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
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
          </Card>
        </section>
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
