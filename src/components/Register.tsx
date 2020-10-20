import React, { Component } from 'react'
import { Link } from 'react-router-dom'

interface IProps { }

interface IState { }

export class Register extends Component<IProps, IState> {
    render() {
        return (
            <>
                <h1>Register</h1>
                <Link to="/login">Already have an account? Login!</Link>
            </>
        )
    }
}