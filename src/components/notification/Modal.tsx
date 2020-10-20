import React, { Component } from 'react';
import "../../styling/notification/Modal.css";

interface IProps {
    modalText: String,
    btn1Text: String,
    btn2Text: String,
    isVisible: boolean,
    hide: () => void
    btn2Func: null | ((...args: any[]) => any)
}

interface IState { }

export class Modal extends Component<IProps, IState> {

    hide = () => {
        this.props.hide();
    }

    render() {
        return (
            this.props.isVisible ?
                <div className="modal" onClick={this.hide}>
                    <div className="modal-content">
                        <span className="close" onClick={this.hide}>X</span>
                        <h1>{this.props.modalText}</h1>
                        <div className="buttons">
                            <button onClick={this.hide}>Text: {this.props.btn1Text}</button>
                            {this.props.btn2Text && this.props.btn2Func ? <button onClick={this.props.btn2Func}>Text: {this.props.btn2Text}</button> : null}
                        </div>
                    </div>
                </div>
                : null
        )
    }
}