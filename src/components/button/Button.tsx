import React from 'react';
import './Button.css';

interface ButtonProps {
    label?: string;
    onClick?: () => void; // 🔧 tornou opcional
    disabled?: boolean;
    className?: string;
    imagem?: string;
    type?: 'submit' | 'reset' | 'button';
}

const Button: React.FC<ButtonProps> = ({
    label,
    onClick,
    disabled = false,
    className = '',
    imagem = null,
    type = 'button'
}) => {
    return (
        <button
            className={`button-${className}`}
            onClick={onClick}
            disabled={disabled}
            type={type}
        >
            {label}
            {imagem ? <img src={imagem} alt="" /> : null}
        </button>
    );
};

export default Button;