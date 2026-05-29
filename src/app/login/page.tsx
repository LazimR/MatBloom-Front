import Images from "@/assets/Images"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-teal-50">
      <header className="border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <img src={Images.logo.src} className="h-10 w-10" alt="logo" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">MATBLOOM</h1>
              <p className="text-sm text-muted-foreground">Avaliação e análise pedagógica em matemática</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-81px)] w-full max-w-6xl items-center justify-center px-6 py-12">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.1fr_440px]">
          <section className="space-y-6">
            <span className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800">
              Taxonomia de Bloom aplicada ao ensino
            </span>
            <div className="space-y-4">
              <h2 className="max-w-2xl text-4xl font-semibold tracking-tight text-foreground lg:text-5xl">
                Organize avaliações, acompanhe erros e gere reforço com base em evidências.
              </h2>
              <p className="max-w-xl text-lg text-muted-foreground">
                O MatBloom apoia professores e gestores na criação de provas, leitura de respostas e análise por conteúdo e nível cognitivo.
              </p>
            </div>
          </section>

          <div className="flex justify-center lg:justify-end">
            <LoginForm />
          </div>
        </div>
      </main>
    </div>
  )
}
