import React, { Component } from 'react'
import { EditorCanvas } from './EditorCanvas'
interface IProps {
    apiURL: string
}

interface IState { }

export class TryIt extends Component<IProps, IState> {

    render() {
        return (
            <EditorCanvas bpm={127} songFileURL={`${this.props.apiURL}/static/audio/TestSong.ogg`} />
        )
    }
}