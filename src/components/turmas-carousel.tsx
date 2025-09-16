'use client'

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Input } from "@/components/ui/input"
import { Search, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function TurmasCarousel() {
  const [searchTerm, setSearchTerm] = useState("")
  const [openAddTurmaModal, setOpenAddTurmaModal] = useState(false)
  
  const turmas = [
    { id: 1, nome: "Turma 5" },
    { id: 2, nome: "Turma 3" },
    { id: 3, nome: "Turma 7" },
  ]

  // Filtrar turmas baseado no termo de busca
  const filteredTurmas = turmas.filter(turma =>
    turma.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddTurma = () => {
    setOpenAddTurmaModal(true)
    console.log("Adicionar turma")
  }

  const clearSearch = () => {
    setSearchTerm("")
  }

  return (
    <div className="w-full space-y-4">
      {/* Campo de busca */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder="Buscar turmas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Resultados da busca */}
      {searchTerm && (
        <div className="text-sm text-muted-foreground">
          {filteredTurmas.length === 0 ? (
            <p>Nenhuma turma encontrada para "{searchTerm}"</p>
          ) : (
            <p>{filteredTurmas.length} turma{filteredTurmas.length !== 1 ? 's' : ''} encontrada{filteredTurmas.length !== 1 ? 's' : ''}</p>
          )}
        </div>
      )}

      {/* Carousel */}
      <Carousel className="w-full max-w-8xl">
        <CarouselContent className="-ml-2 md:-ml-4">
          {filteredTurmas.map((turma) => (
            <CarouselItem key={turma.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-0" >
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground">{turma.nome}</h3>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}

          {/* Card de adicionar (só mostra se não há filtro ativo) */}
          {!searchTerm && (
            <CarouselItem className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow border-dashed border-2 border-muted-foreground/25">
                <CardContent className="p-0" onClick={handleAddTurma}>
                  <div className="h-48 bg-muted/50 rounded-t-lg flex items-center justify-center">
                    <Plus className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-muted-foreground text-center">Adicionar Turma</h3>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          )}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  )
}
