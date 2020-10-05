import React from 'react';
import './App.css';

interface IProps {

}

interface IState {
  count: number;
}

export default class App extends React.Component<IProps, IState> {

  state: IState = {
    count: 0
  }

  buttonClick = () => {
    this.setState({
      count: (this.state.count + 1)
    });
  }

  render() {
    return (
      <button onClick={this.buttonClick}>{this.state.count}</button>
    )
  }
}
