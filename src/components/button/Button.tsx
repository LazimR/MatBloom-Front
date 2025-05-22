import React from 'react';
import './Button.css';

interface ButtonProps {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    className?: string;
    imagem?: string;
}

const Button: React.FC<ButtonProps> = ({ label, onClick, disabled = false, className = '', imagem = null }) => {
    return (
        <button
            className={`button-${className}`}
            onClick={onClick}
            disabled={disabled}
        >
            {label}
            {imagem != null ? <img src={imagem} ></img> : null}
        </button>
    );
};

export default Button;