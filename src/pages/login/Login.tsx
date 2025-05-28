import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch } from "../../hooks/Redux.ts";
import { login } from "../../services/request/Index.ts"
import Input from "../../components/input/Input";
import Button from "../../components/button/Button";
import Images from "../../assets/Images";
import "./Login.css"
import { setUser } from "../../store/slices/User.ts";

function Login() {
    const navigate = useNavigate();

    const [data, setData] = useState({username: "", password: ""});
    const [loginFail, setLoginFail] = useState(false);
    const dispatch = useAppDispatch()

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        console.log("Bom dia")
        event.preventDefault();
        const params = new URLSearchParams();
        params.append("username", data.username);
        params.append("password", data.password);

        console.log("Params: ", params.get("username"), params.get("password"));

        login(params)
            .then((response) => {
                console.log("Response: ", response);
                if (response.statusCode === 200){
                    let data = response.responseBody;
                    try{
                        dispatch(setUser({name: data.username, email: data.email, classes: data.classes}))
                        localStorage.setItem("token", data.token);
                        navigate("/ds");
                    }
                    catch (error){
                        alert(error);
                    }
                }
                if (response.statusCode === 401){
                    setLoginFail(true);
                }
            
        })
            .catch((error) => {
                console.log("Error: ", error);
            })
    }

    return (
        <div className="login">
            <h2>ACESSE SUA CONTA</h2>
            <form
                id="login-form"
                onSubmit={handleSubmit}            
            >
                <Input
                    type="text"
                    placeholder="Login"
                    onChange={(e) => setData({...data, username: e.target.value})}
                />
                <Input
                    type="password"
                    placeholder="Senha"
                    onChange={(e) => setData({...data, password: e.target.value})}
                />
                <Button
                    imagem={Images.arrow}
                    className="login"
                    label="ENTRAR"
                    type="submit"
                />
                {loginFail && <p className="error">Login ou senha incorretos!</p>}
            </form>
        </div>
    );
}

export default Login;