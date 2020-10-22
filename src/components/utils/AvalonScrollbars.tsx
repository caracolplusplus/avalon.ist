// External

import React, { Component, createRef } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';

// Declaration

interface ScrollbarProps {
  horizontal?: boolean;
}

class AvalonScrollbars extends Component<ScrollbarProps, {}> {
  scrollbars = createRef<Scrollbars>();
  threshold = 0.95;
  floored = true;

  constructor(props: ScrollbarProps) {
    super(props);
    this.autoScroll = this.autoScroll.bind(this);
    this.checkIfFloored = this.checkIfFloored.bind(this);
  }

  checkIfFloored() {
    try {
      const ref = this.scrollbars.current!;

      this.floored = ref.getValues().top === 1;
    } catch (e) {
      console.log(e);
    }
  }

  autoScroll() {
    const ref = this.scrollbars.current!;

    if (this.floored) {
      ref.scrollToBottom();
    }
  }

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
          <div {...props} className={this.props.horizontal ? 'thumb-horizontal' : 'thumb-hidden'} />
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
