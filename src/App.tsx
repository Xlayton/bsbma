import React, { Component, CSSProperties } from 'react';
import './App.css';
import { Confirmation } from './notification/Confirmation';
import { Modal } from './notification/Modal';
import { Toast } from './notification/Toast';

interface IProps {
}

interface IState {
  modalVisible: boolean
  toastVisible: boolean
  confirmationVisible: boolean
}

export default class App extends Component<IProps, IState> {

  state: IState = {
    modalVisible: false,
    toastVisible: false,
    confirmationVisible: false
  }

  showModal = () => {
    this.setState({ modalVisible: true });
  }
  showToast = () => {
    this.setState({ toastVisible: true });
  }
  showConfirmation = () => {
    this.setState({ confirmationVisible: true })
  }

  hideModal = () => {
    this.setState({ modalVisible: false })
  }
  hideToast = () => {
    this.setState({ toastVisible: false })
  }
  hideConfirmation = () => {
    this.setState({ confirmationVisible: false })
  }

  confirmationAction = () => {
    console.log("Oh dang, you confirmed");
  }

  render() {
    let exampleStyle: CSSProperties = {
      position: "relative"
    };

    return (
      <>
        <button onClick={this.showModal}>Modal</button>
        <button onClick={this.showToast}>Toast</button>
        <div style={exampleStyle}>
          <button onClick={this.showConfirmation}>Confirmation</button>
          <Confirmation confirmationQuestion="Are you sure?" hide={this.hideConfirmation} action={this.confirmationAction} isVisible={this.state.confirmationVisible} />
        </div>
        <Modal modalText="Modal Test" btn1Text="Ok" btn2Text="" isVisible={this.state.modalVisible} btn2Func={null} hide={this.hideModal} />
        <Toast toastText="Test Toast!" isVisible={this.state.toastVisible} hide={this.hideToast} type="danger" />
        <h1>Hello World!</h1>
      </>
    )
  }
}
