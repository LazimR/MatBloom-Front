'use client'

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Input } from "@/components/ui/input"
import { Search, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ProvasCarousel() {
  const [searchTerm, setSearchTerm] = useState("")
  const [openAddProvaModal, setOpenAddProvaModal] = useState(false)
  const provas = [
    { id: 1, nome: "Prova de Potência" },
    { id: 2, nome: "Prova de Matemática" },
    { id: 3, nome: "Prova de Física" },
    { id: 4, nome: "Prova de Potência" },
    { id: 5, nome: "Prova de Matemática" },
    { id: 6, nome: "Prova de Física" },
  ]

  // Filtrar provas baseado no termo de busca
  const filteredProvas = provas.filter(prova =>
    prova.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const clearSearch = () => {
    setSearchTerm("")
  }

  const handleAddProva = () => {
    setOpenAddProvaModal(true)
    console.log("Adicionar prova")
  }

  return (
    <div className="w-full space-y-4">
      {/* Campo de busca */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder="Buscar provas..."
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
          {filteredProvas.length === 0 ? (
            <p>Nenhuma prova encontrada para "{searchTerm}"</p>
          ) : (
            <p>{filteredProvas.length} prova{filteredProvas.length !== 1 ? 's' : ''} encontrada{filteredProvas.length !== 1 ? 's' : ''}</p>
          )}
        </div>
      )}

      {/* Carousel */}
      <Carousel className="w-full max-w-8xl">
        <CarouselContent className="-ml-2 md:-ml-4">
          {filteredProvas.map((prova) => (
            <CarouselItem key={prova.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground">{prova.nome}</h3>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}

          {/* Card de adicionar (só mostra se não há filtro ativo) */}
          {!searchTerm && (
            <CarouselItem className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow border-dashed border-2 border-muted-foreground/25">
                <CardContent className="p-0" onClick={handleAddProva}>
                  <div className="h-48 bg-muted/50 rounded-t-lg flex items-center justify-center">
                    <Plus className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-muted-foreground text-center">Adicionar Prova</h3>
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
