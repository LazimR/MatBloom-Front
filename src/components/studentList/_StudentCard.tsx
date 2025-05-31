import { useRef, useState, useEffect } from "react";

import Images from "../../assets/Images";

import Button from "../button/Button";

interface Student {
    id: number;
    name: string;
}

const _PopUp = () => {
    return (
        <div className="popup">
            <Button
                type="button"
                label="Analise do Aluno"
            />
            <Button
                type="button"
                label="Editar Aluno"
            />
            <Button
                type="button"
                label="Excluir Aluno"
            />
        </div>
    );
}

const StudentCard:React.FC<Student> = ({ id, name }) => {
    const [showPopup, setShowPopup] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                setShowPopup(false);
            }
        }
        if (showPopup) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showPopup]);

    return (
        <div className="student-card">
            <p>{name}</p>
            <div style={{ display: "flex",flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <p>ID: {id}</p>
            <Button
                type="button"
                imagem={Images.more_vertical}
                onClick={() => setShowPopup(!showPopup)}
            />
            </div>
            {showPopup && <div className="popup-container" ref={popupRef} ><_PopUp /></div>}
        </div>
    );
}

export default StudentCard;