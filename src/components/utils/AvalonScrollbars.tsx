// External

import React, { Component, createRef } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';

// Declaration

interface ScrollbarProps {
  horizontal?: boolean;
}

class AvalonScrollbars extends Component<ScrollbarProps, {}> {
  scrollbars = createRef<Scrollbars>();
  threshold = 0.98;
  prev = 0;
  floored = true;

  checkIfFloored = () => {
    try {
      const ref = this.scrollbars.current!;

      const top = ref.getValues().top;
      const delta = top - this.prev;
      this.prev = top;

      if (delta >= 0) {
        this.floored = top >= this.threshold;
      } else {
        this.floored = false;
      }
    } catch (e) {
      console.log(e);
    }
  };

  autoScroll = () => {
    const ref = this.scrollbars.current!;

    if (this.floored) {
      this.prev = 0;

      ref.scrollToBottom();
    }
  };

  render() {
    return (
      <Scrollbars
        ref={this.scrollbars}
        autoHide
        autoHideTimeout={200}
        autoHideDuration={200}
        onScroll={this.checkIfFloored}
        renderTrackHorizontal={(props) => <div {...props} className="track-horizontal" />}
        renderTrackVertical={(props) => <div {...props} className="track-vertical" />}
        renderThumbHorizontal={(props) => (
          <div
            {...props}
            className={this.props.horizontal ? 'thumb-horizontal' : 'thumb-hidden'}
          />
        )}
        renderThumbVertical={(props) => <div {...props} className="thumb-vertical" />}
        renderView={(props) => <div {...props} className="view" />}
      >
        {this.props.children}
      </Scrollbars>
    );
  }
}

export default AvalonScrollbars;
