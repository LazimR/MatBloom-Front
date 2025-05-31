import React from 'react';
import './Button.css';

interface ButtonProps {
    label?: string;
    onClick?: () => void; // 🔧 tornou opcional
    disabled?: boolean;
    className?: string;
    imagem?: string;
    ariaLabel?: string;
    type?: 'submit' | 'reset' | 'button';
}

const Button: React.FC<ButtonProps> = ({
    label,
    onClick,
    disabled = false,
    className = '',
    imagem = null,
    type = 'button',
    ariaLabel = '',
}) => {
    return (
        <button 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            className={`button-${className}`}
            onClick={onClick}
            disabled={disabled}
            type={type}
            aria-label={ariaLabel}
        >
            {<p>{label}</p>}
            {imagem ? <img src={imagem} alt="" /> : null}
        </button>
    );
};

export default Button;