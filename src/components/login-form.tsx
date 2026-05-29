"use client"

import type React from "react"
import { useRouter } from "next/navigation"

import { useState } from "react"
import { useAppDispatch } from "@/hooks/Redux"
import { login } from "@/services/request/Index"
import { setUser } from "@/store/slices/User"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export function LoginForm() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage("")

    const response = await login({ username, password })

    if (response.statusCode !== 200 || !("user" in response.responseBody)) {
      setErrorMessage(
        "error" in response.responseBody ? response.responseBody.error : "Não foi possível iniciar a sessão."
      )
      setIsSubmitting(false)
      return
    }

    dispatch(
      setUser({
        id: response.responseBody.user.id,
        username: response.responseBody.user.username,
        email: response.responseBody.user.email,
        role: response.responseBody.user.role,
        classes: response.responseBody.user.classes,
      })
    )

    router.replace("/dashboard")
  }

  return (
    <Card className="w-full max-w-md border-border/70 shadow-lg">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl">Acesse sua conta</CardTitle>
        <CardDescription>
          Entre para gerenciar turmas, provas e análises pedagógicas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="login" className="text-sm font-medium text-foreground">
              Login
            </label>
            <Input
              id="login"
              type="text"
              placeholder="Seu usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-11 bg-background"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Senha
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 bg-background"
              required
            />
          </div>

          <Button
            type="submit"
            className="h-11 w-full bg-teal-700 text-white hover:bg-teal-800"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Entrando..." : "Entrar"}
          </Button>
          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
        </form>
      </CardContent>
    </Card>
  )
}
