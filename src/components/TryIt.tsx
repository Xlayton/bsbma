import React, { Component } from 'react'
const THREE = require("three.js")
interface IProps { }

interface IState { }

export class TryIt extends Component<IProps, IState> {

    componentDidMount() {
        var renderer = new THREE.WebGLRenderer();
        let attempt = document.getElementById("attempt")
        if (attempt) {
            renderer.setSize(attempt.clientWidth, attempt.clientHeight);
            attempt.appendChild(renderer.domElement)
        }

    }

    render() {
        return (
            <>
                <div id="attempt"></div>
            </>
        )
    }
}