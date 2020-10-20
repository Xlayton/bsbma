import React, { Component } from 'react'
import { Link } from 'react-router-dom'

interface IProps { }

interface IState { }

export class Login extends Component<IProps, IState> {
    render() {
        return (
            <>
                <h1>Login</h1>
                <Link to="/register">Don't have an account? Register!</Link>
            </>
        )
    }
}