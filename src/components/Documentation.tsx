import React, { Component } from 'react'

interface IProps { }

interface IState { }

export class Documentation extends Component<IProps, IState> {
    render() {
        return (
            <>
                <h1>Documentation</h1>
                <iframe title="BSMG Mapping Docs" src="http://bsmg.wiki/mapping/intermediate-mapping.html"
                    width="100%" height="100%" frameBorder="0"
                    allowFullScreen>
                    <p>
                        <a href="bsmg.wiki/mapping/map-format.html">
                            Fallback link for browsers that don't support iframes
                        </a>
                    </p>
                </iframe>
            </>
        )
    }
}