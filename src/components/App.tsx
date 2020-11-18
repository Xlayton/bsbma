import React, { Component } from 'react';
import { BrowserRouter, Redirect, Route } from 'react-router-dom'
import '../styling/App.css';
import { AccountHome } from './AccountHome';
import { Documentation } from './Documentation';
import { GetStarted } from './GetStarted';
import { Homepage } from './Homepage';
import { Navbar } from './Navbar';
import { TryIt } from './TryIt';
import { Maps } from './Maps';
import { Login } from './Login';
import { Register } from './Register';

interface IProps {
}

interface IState {
  isUserLogged: boolean
  apiURL: string
  shouldLogout: boolean
  user: {
    email: string,
    image: string,
    mapids: Array<String>,
    password: string,
    username: string,
    uuid: string
  }
}

export default class App extends Component<IProps, IState> {

  state: IState = {
    isUserLogged: false,
    apiURL: "http://localhost:10000",
    shouldLogout: false,
    user: {
      email: "",
      image: "",
      mapids: [],
      password: "",
      username: "",
      uuid: ""
    },
  }

  setUserLogged = (isUserLogged: boolean, userData: {
    email: "",
    image: "",
    mapids: [],
    password: "",
    username: "",
    uuid: ""
  }) => {
    window.localStorage.setItem("user-data", JSON.stringify({ isUserLogged, userData }))
    this.setState({ isUserLogged: isUserLogged, user: userData })
  }

  shouldLogout = () => {
    window.localStorage.clear()
    this.setState({ shouldLogout: true })
  }

  componentDidMount() {
    let userData = window.localStorage.getItem("user-data")
    if (userData) {
      let userDataParse = JSON.parse(userData)
      let userLogStatus = userDataParse.isUserLogged === true ? true : false
      let userInfo = userDataParse.userData
      console.log(userDataParse)
      this.setState({ isUserLogged: userLogStatus, user: userInfo })
    }
  }

  render() {
    return (
      <article className="app">
        <BrowserRouter>
          <section className="nav-area">
            <Navbar isUserLogged={this.state.isUserLogged} shouldLogout={this.shouldLogout} />
          </section>
          <section className="content-area">
            <Route exact path="/" >
              <Homepage />
            </Route>
            <Route exact path="/getstarted" >
              <GetStarted />
            </Route>
            <Route exact path="/tryit" >
              <TryIt apiURL={this.state.apiURL} />
            </Route>
            <Route exact path="/documentation" >
              <Documentation />
            </Route>
            <Route exact path="/acchome" >
              <AccountHome isUserLogged={this.state.isUserLogged} />
            </Route>
            <Route exact path="/maps" >
              <Maps apiURL={this.state.apiURL} isUserLogged={this.state.isUserLogged} userUUID={this.state.user.uuid} />
            </Route>
            <Route exact path="/login">
              <Login setUserLogged={this.setUserLogged} apiURL={this.state.apiURL} />
            </Route>
            <Route exact path="/register">
              <Register apiURL={this.state.apiURL} />
            </Route>
            <Route exact path="/logout">
              {
                this.state.shouldLogout && this.state.isUserLogged ? this.setState({ isUserLogged: false, shouldLogout: false }) : null
              }
              <Redirect to="/" />
            </Route>
          </section>
        </BrowserRouter>
      </article>
    )
  }
}
