import React, { Component } from 'react'
import { EditorCanvas } from './EditorCanvas'
interface IProps { }

interface IState { }

export class TryIt extends Component<IProps, IState> {

    render() {
        return (
            <EditorCanvas />
        )
    }
}