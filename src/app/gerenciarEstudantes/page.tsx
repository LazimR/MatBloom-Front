"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Pagination,
  PaginationNext,
  PaginationItem,
  PaginationPrevious,
  PaginationContent,
  PaginationEllipsis,
  PaginationLink,
} from "@/components/ui/pagination"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableFooter } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EllipsisVertical, Pencil, Plus, Search, Trash } from "lucide-react"
import { useEffect, useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function ManageStudentsPage() {
  const students = [
    {
      id: 1,
      name: "John Doe",
    },
    {
      id: 2,
      name: "Jane Doe",
    },
    {
      id: 3,
      name: "John Doe",
    },
    {
      id: 4,
      name: "Jane Doe",
    },
    {
      id: 5,
      name: "John Doe",
    },
    {
      id: 6,
      name: "Jane Doe",
    },
    {
      id: 7,
      name: "John Doe",
    },
    {
      id: 8,
      name: "Jane Doe",
    },
    {
      id: 9,
      name: "John Doe",
    },
    {
      id: 10,
      name: "Jane Doe",
    },
    {
      id: 11,
      name: "John Doe",
    },
    {
      id: 12,
      name: "Jane Doe",
    },
    {
      id: 13,
      name: "John Doe",
    },
    {
      id: 14,
      name: "Jane Doe",
    },
    {
      id: 15,
      name: "John Doe",
    },
    {
      id: 16,
      name: "Jane Doe",
    },
    {
      id: 17,
      name: "John Doe",
    },
    {
      id: 18,
      name: "Jane Doe",
    },
    {
      id: 19,
      name: "John Doe",
    },
    {
      id: 20,
      name: "Jane Doe",
    },
    {
      id: 21,
      name: "John Doe",
    },
    {
      id: 22,
      name: "Jane Doe",
    },
    {
      id: 23,
      name: "John Doe",
    },
    {
      id: 24,
      name: "Jane Doe",
    },
    {
      id: 25,
      name: "John Doe",
    },
    {
      id: 26,
      name: "Jane Doe",
    },
    {
      id: 27,
      name: "John Doe",
    },
    {
      id: 28,
      name: "Jane Doe",
    },
    {
      id: 29,
      name: "John Doe",
    },
    {
      id: 30,
      name: "Jane Doe",
    },
  ]

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredStudents, setFilteredStudents] = useState(students)
  const [totalPages, setTotalPages] = useState(Math.ceil(filteredStudents.length / pageSize))
  const [viewStudents, setViewStudents] = useState(filteredStudents)

  useEffect(() => {
    const filtered = students.filter((student) => student.name.toLowerCase().includes(searchTerm.toLowerCase()))
    setFilteredStudents(filtered)
    setCurrentPage(1)
  }, [searchTerm])

  useEffect(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    setViewStudents(filteredStudents.slice(start, end))
    setTotalPages(Math.ceil(filteredStudents.length / pageSize))
  }, [currentPage, pageSize, filteredStudents])

  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
        // Se temos 3 páginas ou menos, mostra todas
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i)
        }
    } else {
        // Se temos mais de 3 páginas, aplica a lógica de intervalo
        if (currentPage <= 2) {
            // Páginas 1, 2, 3
            for (let i = 1; i <= 3; i++) {
                pages.push(i)
            }
        } else if (currentPage >= totalPages - 1) {
            // Últimas 3 páginas
            for (let i = totalPages - 2; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            // Página atual e uma antes e uma depois
            for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                pages.push(i)
            }
        }
    }
    
    return pages
}

  const handleAddStudent = () => {
    console.log("Add student clicked")
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Estudantes</CardTitle>
          <Button onClick={handleAddStudent} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Aluno
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Pesquisar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Turma</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {viewStudents.map((student) => (
              <TableRow key={student.id}>
                <TableCell>{student.name}</TableCell>
                <TableCell>{"-"}</TableCell>
                <TableCell>{student.id}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            <EllipsisVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem>
                            <Pencil className="h-4 w-4" />
                            Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Trash className="h-4 w-4" />
                            Excluir
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          {filteredStudents.length > 0 && (
            <TableFooter>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  {currentPage > 2 && totalPages > 3 && (
                    <>
                      <PaginationItem>
                        <PaginationLink onClick={() => setCurrentPage(1)}>1</PaginationLink>
                      </PaginationItem>
                      {currentPage > 3 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                    </>
                  )}

                  {getPageNumbers().map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink 
                        onClick={() => setCurrentPage(page)} 
                        isActive={currentPage === page}
                    >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  {currentPage < totalPages - 1 && totalPages > 3 && (
                    <>
                      {currentPage < totalPages - 2 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink onClick={() => setCurrentPage(totalPages)}>{totalPages}</PaginationLink>
                      </PaginationItem>
                    </>
                  )}
                  <PaginationItem>
                    <PaginationNext href="#" onClick={() => setCurrentPage(currentPage + 1)} 
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </TableFooter>
          )}
        </Table>
        {filteredStudents.length === 0 && (
          <div className="text-center py-8 text-gray-500">Nenhum estudante encontrado para "{searchTerm}"</div>
        )}
      </CardContent>
    </Card>
  )
}
