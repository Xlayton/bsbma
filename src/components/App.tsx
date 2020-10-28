import React, { Component } from 'react';
import { BrowserRouter, Route } from 'react-router-dom'
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
}

export default class App extends Component<IProps, IState> {

  state: IState = {
    isUserLogged: false,
    apiURL: "http://localhost:10000"
  }

  setUserLogged = (isUserLogged: boolean) => {
    this.setState({ isUserLogged: isUserLogged })
  }

  render() {
    return (
      <article className="app">
        <BrowserRouter>
          <section className="nav-area">
            <Navbar isUserLogged={this.state.isUserLogged} />
          </section>
          <section className="content-area">
            <Route exact path="/" >
              <Homepage />
            </Route>
            <Route exact path="/getstarted" >
              <GetStarted />
            </Route>
            <Route exact path="/tryit" >
              <TryIt />
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
          </section>
        </BrowserRouter>
      </article>
    )
  }
}
