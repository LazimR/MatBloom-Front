import React from "react";
import Images from "../../assets/Images";
import "./Header.css"; // Arquivo CSS para estilização

const Header: React.FC = () => {
  return (
    <header className="header">
      <p className="header-title">MATBLOOM</p>
      <img
        src={Images.logo} // Substitua pelo caminho da sua imagem
        alt="Logo"
        className="header-logo"
      />
    </header>
  );
};

export default Header;