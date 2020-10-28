import React, { Component } from 'react'
import { Link } from 'react-router-dom'

interface IProps {
    setUserLogged: (val: boolean) => void
    apiURL: string
}

interface IState {
    userID: string
    password: string
    errorText: string
}

export class Login extends Component<IProps, IState> {

    state: IState = {
        userID: "",
        password: "",
        errorText: ""
    }

    onUserIDChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ userID: evt.target.value })
    }

    onPasswordChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ password: evt.target.value })
    }

    onLogin = () => {
        fetch(`${this.props.apiURL}/getuser?userid=${this.state.userID}&password=${this.state.password}`)
            .then(res => res.json())
            .then(data => {
                if (data.code === 200) {
                    this.props.setUserLogged(true)
                } else {
                    console.log(data)
                    this.setState({ errorText: data.message });
                }
            })
    }

    render() {
        return (
            <section className="form">
                <h1>Login</h1>
                <p className="error-text">{this.state.errorText}</p>
                <section className="inputs">
                    <input type="text" placeholder="Email/Username" value={this.state.userID} onChange={this.onUserIDChange} />
                    <input type="password" placeholder="Password" value={this.state.password} onChange={this.onPasswordChange} />
                    <button onClick={this.onLogin}>Login</button>
                </section>
                <Link className="link" to="/register">Don't have an account? Register!</Link>
            </section>
        )
    }
}