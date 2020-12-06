import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'
import { Toast } from './notification/Toast';

interface IProps {
    isUserLogged: boolean
    user: {
        email: string,
        image: string,
        mapids: Array<String>,
        password: string,
        username: string,
        uuid: string
    },
    apiURL: string
}

interface IState {
    username: string
    oldPass: string
    newPass: string
    newPassConfirm: string
    email: string
    profileImage: File | null
    errorText: string
    shouldShowToast: boolean
    toastMsg: string
    toastType: "danger" | "success" | ""
}

export class AccountHome extends Component<IProps, IState> {

    state: IState = {
        username: "",
        oldPass: "",
        newPass: "",
        newPassConfirm: "",
        email: "",
        profileImage: null,
        errorText: "",
        shouldShowToast: false,
        toastMsg: "",
        toastType: ""
    }

    onFileChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        if (evt.target.files)
            this.setState({ profileImage: evt.target.files[0] });
    }

    getUsername = () => {
        let stuff = "!";
        let unparseData = window.localStorage.getItem("user-data");
        if (unparseData) {
            let data = JSON.parse(unparseData)
            stuff = ` ${data.userData.username}!`
        }
        return stuff
    }

    onEdit = () => {
        if (this.state.newPass !== this.state.newPassConfirm) {
            this.setState({ newPass: "", newPassConfirm: "", errorText: "Password did not match confirmation" })
            return
        }
        const formData = new FormData();
        if (this.state.profileImage) {
            formData.append("profileimage", this.state.profileImage, this.state.profileImage.name)
        }
        formData.append("username", this.state.username)
        formData.append("email", this.state.email)
        formData.append("oldpass", this.state.oldPass)
        formData.append("newpass", this.state.newPass)
        formData.append("uuid", this.props.user.uuid)
        fetch(`${this.props.apiURL}/edituser`, { method: "PUT", body: formData })
            .then(res => res.json())
            .then(data => {
                if (data.code === 200) {
                    console.log(data)
                    this.setState({ shouldShowToast: true, toastMsg: "Successfully Editted User", toastType: "success" })
                } else {
                    console.log(data)
                    this.setState({ shouldShowToast: true, toastMsg: data.message, toastType: "danger" })
                }
            })
    }

    componentDidMount() {
        this.setState({ username: this.props.user.username, email: this.props.user.email })
    }

    render() {
        return (
            <>
                <Toast isVisible={this.state.shouldShowToast} toastText={this.state.toastMsg} hide={() => this.setState({ shouldShowToast: false })} type={this.state.toastType} />
                {!this.props.isUserLogged ? <Redirect to="/" /> : null}
                <h1>Welcome Back{this.getUsername()}</ h1>
                <section className="form">
                    <section className="inputs">
                        <div>
                            <label>Username:</label>
                            <input type="text" className="text-input" placeholder="Username..." onChange={(evt) => this.setState({ username: evt.target.value })} value={this.state.username} />
                        </div>
                        <div>
                            <label>Email:</label>
                            <input type="text" className="text-input" placeholder="Email..." onChange={(evt) => this.setState({ email: evt.target.value })} value={this.state.email} />
                        </div>
                        <div>
                            <label>Confirm Old Pass:</label>
                            <input type="password" className="text-input" placeholder="Confirm Old Pass..." onChange={(evt) => this.setState({ oldPass: evt.target.value })} value={this.state.oldPass} />
                        </div>
                        <div>
                            <label>(Optional)New Pass:</label>
                            <input type="password" className="text-input" placeholder="New Pass..." onChange={(evt) => this.setState({ newPass: evt.target.value })} value={this.state.newPass} />
                        </div>
                        <div>
                            <label>(Optional)Confirm New Pass:</label>
                            <input type="password" className="text-input" placeholder="Confirm New Pass..." onChange={(evt) => this.setState({ newPassConfirm: evt.target.value })} value={this.state.newPassConfirm} />
                        </div>
                        <div>
                            <label>(Optional)New Profile Image:</label>
                            <input type="file" title="New Profile Image..." onChange={this.onFileChange} accept=".jpg,.png,.jpeg|image/*" />
                        </div>
                    </section>
                    <button onClick={() => this.onEdit()}>Edit Profile</button>
                </section>
            </>
        )
    }
}