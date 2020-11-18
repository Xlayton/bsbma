import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'

interface IProps {
    isUserLogged: boolean
    userUUID: string
    apiURL: string
}

interface IState {
    maps: Array<any>
}

export class Maps extends Component<IProps, IState> {
    state: IState = {
        maps: []
    }

    componentDidMount() {
        if (this.props.isUserLogged) {
            fetch(`${this.props.apiURL}/getmaps?uuid=${this.props.userUUID}`)
                .then(res => res.json())
                .then(data => this.setState({ maps: data.maps }))
        }
    }

    render() {
        return (
            <>
                {!this.props.isUserLogged ? <Redirect to="/" /> : null}
                <h1>Maps</ h1>
                <button>Create Map</button>
                <section id="mapContainer">
                    {this.state.maps.map(map => (
                        <article className="map" key={map.id}>
                            <p>{map.name}</p>
                        </article>
                    )
                    )}
                </section>
            </>
        )
    }
}