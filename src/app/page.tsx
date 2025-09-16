import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex flex-col gap-4">
        <h1 className="text-4xl font-bold">Bem-vindo ao MatBloom</h1>
        <p className="text-lg mt-4">Sistema de gerenciamento educacional</p>
        
        <div className="flex gap-4 mt-8">
          <Button variant="default">Botão Primário</Button>
          <Button variant="secondary">Botão Secundário</Button>
          <Button variant="outline">Botão Outline</Button>
          <Button variant="destructive">Botão Destrutivo</Button>
        </div>
      </div>
    </main>
  )
}
