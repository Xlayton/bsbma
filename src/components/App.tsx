import React, { Component } from 'react';
import { BrowserRouter, Redirect, Route } from 'react-router-dom'
import '../styling/App.css';
import { AccountHome } from './AccountHome';
import { Documentation } from './Documentation';
import { Homepage } from './Homepage';
import { Navbar } from './Navbar';
import { TryIt } from './TryIt';
import { Maps } from './Maps';
import { Login } from './Login';
import { Register } from './Register';
import { EditorCanvas } from './EditorCanvas';

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
  selectedBeatmap: {
    id: string,
    beatmapfile: string,
    songfile: string,
    difficulty: string,
    difficultylabel: string,
    notejumpoffset: number,
    notejumpspeed: number,
    bpm: number
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
    selectedBeatmap: {
      id: "",
      beatmapfile: "",
      songfile: "",
      difficulty: "",
      difficultylabel: "",
      notejumpoffset: 0,
      notejumpspeed: 0,
      bpm: 0
    }
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

  setSelectedBeatmap = (id: string, beatmapfile: string, songfile: string, difficulty: string, difficultylabel: string, notejumpoffset: number, notejumpspeed: number, bpm: number, after?: () => void) => {
    let beatmap = {
      id,
      beatmapfile,
      songfile,
      difficulty,
      difficultylabel,
      notejumpoffset,
      notejumpspeed,
      bpm
    }
    this.setState({selectedBeatmap: beatmap}, after)
  }

  shouldRedirectToAccHome = () => {
    return this.state.isUserLogged ? <Redirect to="/acchome" /> : null
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
      this.setState({ isUserLogged: userLogStatus, user: userInfo })
      
    }
  }

  render() {
    return (
      <article className="app">
        <BrowserRouter>
          <section className="nav-area">
            <Navbar isUserLogged={this.state.isUserLogged} shouldLogout={this.shouldLogout} userImagePath={this.state.user.image} apiUrl={this.state.apiURL} />
          </section>
          <section className="content-area">
            <Route exact path="/" >
              <Homepage />
            </Route>
            <Route exact path="/tryit" >
              <TryIt apiURL={this.state.apiURL} />
            </Route>
            <Route exact path="/documentation" >
              <Documentation />
            </Route>
            <Route exact path="/acchome" >
              <AccountHome apiURL={this.state.apiURL} isUserLogged={this.state.isUserLogged} user={this.state.user} />
            </Route>
            <Route exact path="/maps" >
              <Maps apiURL={this.state.apiURL} isUserLogged={this.state.isUserLogged} userUUID={this.state.user.uuid} setSelectedBeatmap={this.setSelectedBeatmap} />
            </Route>
            <Route exact path="/editmap">
              <EditorCanvas apiURL={this.state.apiURL} beatmapid={this.state.selectedBeatmap.id} canSave={true} bpm={this.state.selectedBeatmap.bpm} songFileURL={`${this.state.apiURL}/static${this.state.selectedBeatmap.songfile}`} />
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
            {this.shouldRedirectToAccHome()}
          </section>
        </BrowserRouter>
      </article>
    )
  }
}
