import React, { Component } from 'react';
import { v4 } from 'uuid';
import Pusher from 'pusher-js';

class Canvas extends Component {
  constructor(props) {
    super(props);

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.endPaintEvent = this.endPaintEvent.bind(this);

    this.pusher = new Pusher('d7c7dd6a47e708c1972a', {
      cluster: 'mt1',
    });
  }
  isPainting = false;
  userStrokeStyle = '#EE92C2';
  guestStrokeStyle = '#F0C987';
  line = [];
  userId = v4();
  prevPos = { offsetX: 0, offsetY: 0 };

  onMouseDown({ nativeEvent }) {
    const { offsetX, offsetY } = nativeEvent;
    this.isPainting = true;
    this.prevPos = { offsetX, offsetY };
  }

  onMouseMove({ nativeEvent }) {
    if (this.isPainting) {
      const { offsetX, offsetY } = nativeEvent;
      const offSetData = { offsetX, offsetY };
      this.position = {
        start: { ...this.prevPos },
        stop: { ...offSetData },
      };
      this.line = this.line.concat(this.position);
      this.paint(this.prevPos, offSetData, this.userStrokeStyle);
    }
  }

  endPaintEvent() {
    if (this.isPainting) {
      this.isPainting = false;
      this.sendPaintData();
    }
  }

  paint(prevPos, currPos, strokeStyle) {
    const { offsetX, offsetY } = currPos;
    const { offsetX: x, offsetY: y } = prevPos;

    this.ctx.beginPath();
    this.ctx.strokeStyle = strokeStyle;
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(offsetX, offsetY);
    this.ctx.stroke();
    this.prevPos = { offsetX, offsetY };
  }

  async sendPaintData() {
    const body = {
      line: this.line,
      userId: this.userId,
    };

    const req = await fetch('http://localhost:4000/paint', {
      method: 'post',
      body: JSON.stringify(body),
      headers: {
        'content-type': 'application/json',
      },
    });
    const res = await req.json();
    this.line = [];
  }

  componentDidMount() {
    this.canvas.width = 1000;
    this.canvas.height = 800;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';
    this.ctx.lineWidth = 5;

    const channel = this.pusher.subscribe('painting');
    channel.bind('draw', (data) => {
      const { userId, line } = data;
      if (userId !== this.userId) {
        line.forEach((position) => {
          this.paint(position.start, position.stop, this.guestStrokeStyle);
        });
      }
    });
  }

  render() {
    return (
      <canvas
        ref={(ref) => (this.canvas = ref)}
        style={{ background: 'black' }}
        onMouseDown={this.onMouseDown}
        onMouseLeave={this.endPaintEvent}
        onMouseUp={this.endPaintEvent}
        onMouseMove={this.onMouseMove}
      />
    );
  }
}

export default Canvas;
