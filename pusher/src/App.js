/* se pueden usar props para que la clase principal tenga el pusher y puedan hacer push desde otros componentes*/
import React, { Component, Fragment } from 'react';
import './App.css';
import Canvas from './canvas';
class App extends Component {
  onstructor(props) {
  this.pusher = new Pusher('d7c7dd6a47e708c1972a', {
      cluster: 'mt1',
    });
  }
  render() {
    return (
      <Fragment>
        <h3 style={{ textAlign: 'center' }}>Canvas</h3>
        <div className="main">
          <div className="color-guide">
            <h5>Color Guide</h5>
            <div className="user user">User</div>
            <div className="user guest">Guest</div>
          </div>
          <Canvas />
        </div>
      </Fragment>
    );
  }
}
export default App;
