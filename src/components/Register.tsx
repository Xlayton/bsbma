import React, { Component } from 'react'
import { Link, Redirect } from 'react-router-dom'

interface IProps {
    apiURL: string
}

interface IState {
    profileImage: File | null
    username: string
    password: string
    confirmPassword: string
    email: string
    shouldRedirect: boolean
    errorText: string
}

export class Register extends Component<IProps, IState> {

    state: IState = {
        profileImage: null,
        username: "",
        password: "",
        confirmPassword: "",
        email: "",
        shouldRedirect: false,
        errorText: ""
    }

    onFileChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        if (evt.target.files)
            this.setState({ profileImage: evt.target.files[0] });
    }

    onUsernameChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ username: evt.target.value })
    }

    onEmailChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ email: evt.target.value })
    }

    onPasswordChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ password: evt.target.value })
    }

    onConfirmPasswordChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ confirmPassword: evt.target.value })
    }

    onRegister = () => {
        if (this.state.profileImage) {
            if (this.state.password !== this.state.confirmPassword) {
                this.setState({ password: "", confirmPassword: "", errorText: "Password did not match confirmation" })
                return
            }
            const formData = new FormData();
            formData.append("profileimage", this.state.profileImage, this.state.profileImage.name)
            formData.append("username", this.state.username)
            formData.append("password", this.state.password)
            formData.append("email", this.state.email)
            fetch(`${this.props.apiURL}/insertuser`, { method: "POST", body: formData })
                .then(res => res.json())
                .then(data => {
                    if (data.code === 200) {
                        this.setState({ shouldRedirect: true })
                    } else {
                        this.setState({ errorText: data.message })
                    }
                })
        } else {
            this.setState({ errorText: "Please upload an image" })
        }
    }

    render() {

        return (
            <section className="form">
                <h1>Register</h1>
                <p className="error-text">{this.state.errorText}</p>
                <section className="inputs">
                    <div>
                        <label>Profile Image:</label>
                        <input type="file" title="Profile Image..." onChange={this.onFileChange} accept=".jpg,.png,.jpeg|image/*" />
                    </div>
                    <input className="text-input" type="input" placeholder="Email..." onChange={this.onEmailChange} value={this.state.email} />
                    <input className="text-input" type="input" placeholder="Username..." onChange={this.onUsernameChange} value={this.state.username} />
                    <input className="text-input" type="password" placeholder="Password..." onChange={this.onPasswordChange} value={this.state.password} />
                    <input className="text-input" type="password" placeholder="Confirm Password..." onChange={this.onConfirmPasswordChange} value={this.state.confirmPassword} />
                    <button onClick={this.onRegister}>Register</button>
                </section>
                {this.state.shouldRedirect ? <Redirect to="/login" /> : null}
                <Link className="link" to="/login">Already have an account? Login!</Link>
            </section>
        )
    }
}