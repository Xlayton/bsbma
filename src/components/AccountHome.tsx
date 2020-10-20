import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'

interface IProps {
    isUserLogged: boolean
}

interface IState { }

export class AccountHome extends Component<IProps, IState> {
    render() {
        return (
            <>
                {this.props.isUserLogged ? <Redirect to="/" /> : null}
                <h1>Account Home</ h1>
            </>
        )
    }
}