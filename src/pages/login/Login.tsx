import Input from "../../components/input/Input";
import Button from "../../components/button/Button";
import Images from "../../assets/Images";
import "./Login.css"

function Login() {
    return (
        <div className="login">
            <h2>ACESSE SUA CONTA</h2>
            <form
                id="login-form"
            >
                <Input
                    type="text"
                    placeholder="Login"
                />
                <Input
                    type="password"
                    placeholder="Senha"
                />
                <Button
                    imagem={Images.arrow}
                    className="login"
                    label="ENTRAR"
                    onClick={()=>{}}
                />
            </form>
        </div>
    );
}

export default Login;