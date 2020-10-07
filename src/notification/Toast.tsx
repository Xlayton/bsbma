import React, { Component } from 'react';
import "./Toast.css";

interface IProps {
    isVisible: boolean
    toastText: String
    hide: () => void
    type: String
}

interface IState { }

export class Toast extends Component<IProps, IState> {

    shouldComponentUpdate(nextProps: Readonly<IProps>) {
        if (nextProps.isVisible && !this.props.isVisible) {
            setTimeout(this.props.hide, 3000)
        }
        return true;
    }


    render() {
        return (
            this.props.isVisible ?
                <div className={`toast ${this.props.type}`}>
                    <p>{this.props.toastText}</p>
                </div>
                : null
        )
    }
}