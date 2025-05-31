
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./ManageStudents.css";

import type { Student } from "../../constants/Interfaces";
import Images from "../../assets/Images";


import Input from "../../components/input/Input";
import StudentList from "../../components/studentList/StudentList";
import Button from "../../components/button/Button";



const ManageStudents = () => {
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const lista: Student[] = [
        { id: 1, name: "João Silva", test_responses: [] },
        { id: 2, name: "Maria Oliveira", test_responses: [] },
        { id: 3, name: "Pedro Santos", test_responses: [] },
        { id: 4, name: "Lazaro Claubert Souza Rodrigues Oliveira", test_responses: [] },
    ]

    return (
        <div className="manage-students">
            <Button
                type="button"
                className="back"
                imagem={Images.left_arrow}
                aria-label="Voltar"
                onClick={() => navigate(-1)}
            />
            <div className="manage-students-content">

                <form className="search-container" onSubmit={() => {}}>
                    <Input
                        type="search"
                        placeholder="Buscar Aluno"
                        className="search-aluno"
                    />
                    <Button
                        type="submit"
                        imagem={Images.search_icon}
                        aria-label="Buscar aluno"
                        className="search-aluno"
                    />
                </form>
                <StudentList list={lista} />
            </div>
            <Button
                    type='button'
                    className={`dropdown${dropdownOpen ? ' button-dropdown-open' : ''}`}
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    imagem={Images.menu}
            />
            
            <div className={`menu${dropdownOpen ? ' menu-open' : ''}`}>
                    <Button
                        type='button'
                        className='dropdown-menu'
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        imagem={Images.left_arrow}
                    ></Button>
                    <ul>
                        <li><a href="#about">Adicionar Aluno</a></li>
                    </ul>
            </div>
        </div>
    );
}

export default ManageStudents;