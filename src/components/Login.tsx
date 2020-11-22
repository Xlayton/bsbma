import React, { Component } from 'react'
import { Link, Redirect } from 'react-router-dom'

interface IProps {
    setUserLogged: (val: boolean, userdata: {
        email: "",
        image: "",
        mapids: [],
        password: "",
        username: "",
        uuid: ""
    }) => void
    apiURL: string
}

interface IState {
    userID: string
    password: string
    errorText: string
    shouldRedirect: boolean
}

export class Login extends Component<IProps, IState> {

    state: IState = {
        userID: "",
        password: "",
        errorText: "",
        shouldRedirect: false
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
                    console.log(data)
                    this.props.setUserLogged(true, data.user)
                    this.setState({ shouldRedirect: true })
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
                    <input className="text-input" type="text" placeholder="Email/Username" value={this.state.userID} onChange={this.onUserIDChange} />
                    <input className="text-input" type="password" placeholder="Password" value={this.state.password} onChange={this.onPasswordChange} />
                    <button onClick={this.onLogin}>Login</button>
                </section>
                <Link className="link" to="/register">Don't have an account? Register!</Link>
                {this.state.shouldRedirect ? <Redirect to="/acchome" /> : null}
            </section>
        )
    }
}