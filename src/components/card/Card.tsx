import Images from "../../assets/Images";
import "./Card.css";

interface CardProps {
    title?: string;
    imagem?: string;
    onClick?: () => void;
};


const Card: React.FC<CardProps> = ({
    title,
    onClick, 
    imagem = Images.card_default
    

}) => {

    return(
        <div className="card">
            <button className="card-button" onClick={onClick}>
                <img src={imagem} alt="" />
                <h2>{title}</h2>
            </button>
        </div>
    )

}

export default Card;