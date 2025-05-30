import { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';

import './Home.css'
import { useAppSelector } from '../../hooks/Redux';
import Button from '../../components/button/Button';
import Card from '../../components/card/Card';
import Images from '../../assets/Images';

import ManageStudents from '../manageStudents/ManageStudents';

const HomePage = () => {
    const user = useAppSelector((state) => state.user);

    const [dropdownOpen, setDropdownOpen] = useState(false);

    console.log("User: ", user);
    return (
        <div className="home">

            <div className={`menu${dropdownOpen ? ' menu-open' : ''}`}>
                <Button
                    type='button'
                    className='dropdown-menu'
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    imagem={Images.left_arrow}
                ></Button>
                <div>
                    <p>Seja Bem-vindo</p>
                    <p id='username'>{user.name}</p>
                </div>
                <hr />
                <ul>
                    <li><Link to="gerenciar-alunos">Gerenciar Alunos</Link></li>
                    <li><a href="#about">Gerenciar Questões</a></li>
                    <li><a href="#contact">Configurações</a></li>
                    <hr />
                    <li><a href="#">Guia</a></li>
                </ul>
            </div>
            <Button
                type='button'
                className={`dropdown${dropdownOpen ? ' button-dropdown-open' : ''}`}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                imagem={Images.menu}
            >
            </Button>

            
            <div className={`content${dropdownOpen ? ' menu-is-open' : ''}`}>
                <div className='cards'>
                    <p>Turmas</p>
                    <div className='cards-carrousel'>
                        <Card title='Turma 1' />
                        <Card title='Turma 2' />
                        <Card title='Turma 3' />
                        <Card title='Turma 4' />
                        <Card title='Turma 5' />
                        <Card title='Adicionar Turma' imagem={Images.card_add}/>
                    </div>
                </div>
                <div className='cards'>
                    <p>Provas</p>
                    <div className='cards-carrousel'>
                        <Card title='Prova 1' />
                        <Card title='Prova 2' />
                        <Card title='Prova 3' />
                        <Card title='Prova 4' />
                        <Card title='Adicionar Prova' imagem={Images.card_add}/>
                    </div>
                </div>
            </div>
            
        </div>
    );
}


const Home = () => {
    return(
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="gerenciar-alunos/*" element={<ManageStudents/>} />
        </Routes>
    )
}

export default Home;