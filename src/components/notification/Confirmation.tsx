import React, { Component } from 'react';
import "../../styling/notification/Confirmation.css";

interface IProps {
    confirmationQuestion: String
    hide: () => void
    action: () => void
    isVisible: boolean
}

interface IState { }

export class Confirmation extends Component<IProps, IState> {
    render() {
        return (
            this.props.isVisible ?
                <div className="confirmation">
                    <p>{this.props.confirmationQuestion}</p>
                    <button className="confirm" onClick={() => { this.props.action(); this.props.hide() }}>Yes</button>
                    <button className="cancel" onClick={this.props.hide}>Cancel</button>
                </div>
                : null
        )
    }
}