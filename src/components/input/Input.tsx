import React from "react";

interface InputProps {
  className?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Input: React.FC<InputProps> = ({
  type = "text",
  placeholder = "Digite aqui...",
  value,
  onChange,
  className = "",
}) => {
  return (
    <input
      className={`input-${className}`}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  );
};

export default Input;