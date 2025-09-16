import { TurmasCarousel } from "@/components/turmas-carousel"
import { ProvasCarousel } from "@/components/provas-carousel"

export default function HomePage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-12">
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Turmas</h2>
            <TurmasCarousel />
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Provas</h2>
            <ProvasCarousel />
          </section>
        </div>
      </main>
    </div>
  )
}
