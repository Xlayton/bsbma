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
}

export default class App extends Component<IProps, IState> {

  state: IState = {
    isUserLogged: false,
    apiURL: "http://localhost:10000",
    shouldLogout: false
  }

  setUserLogged = (isUserLogged: boolean) => {
    this.setState({ isUserLogged: isUserLogged })
  }

  shouldLogout = () => {
    this.setState({ shouldLogout: true })
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
              <Maps isUserLogged={this.state.isUserLogged} />
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
