import React, { Component } from 'react'
import Logo from '../images/Logo.png'
import { Link } from 'react-router-dom'

interface IProps {
    isUserLogged: boolean
    shouldLogout: () => void
    userImagePath : string
    apiUrl: string
}

interface IState { }

export class Navbar extends Component<IProps, IState> {
    render() {
        return (
            <>
                <section className="logo">
                    {this.props.isUserLogged ?
                        (
                            <>
                                <img src={this.props.apiUrl + this.props.userImagePath} alt="Logo" />
                            </>
                        )
                        :
                        (
                            <>
                                <img src={Logo} alt="Logo" />
                                <h2 className="logo-text">BSBMA</h2>
                            </>
                        )}
                </section>
                <section className="nav-eles">
                    {this.props.isUserLogged ?
                        (
                            <>
                                <Link to="/acchome">Home</Link>
                                <Link to="/documentation">Documentation</Link>
                                <Link to="/maps">Maps</Link>
                            </>
                        )
                        :
                        (
                            <>
                                <Link to="/">Home</Link>
                                <Link to="/documentation">Documentation</Link>
                                <Link to="/tryit">Try It</Link>
                            </>
                        )
                    }
                </section>
                <section className="logout-login">
                    {this.props.isUserLogged ?
                        (
                            <Link to="/logout" onClick={this.props.shouldLogout}>Logout</Link>
                        )
                        :
                        (
                            <Link to="/login">Login/Register</Link>
                        )
                    }
                </section>
            </>
        )
    }
}