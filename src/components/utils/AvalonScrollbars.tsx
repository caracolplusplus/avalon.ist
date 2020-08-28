// External

import React, { Component, createRef } from "react";
import { Scrollbars } from "react-custom-scrollbars";

// Declaration

class AvalonScrollbars extends Component<{}, {}> {
  scrollbars = createRef<Scrollbars>();
  top = 1;
  threshold = 0.95;

  constructor(props: {}) {
    super(props);
    this.autoScroll = this.autoScroll.bind(this);
    this.getScrollBottom = this.getScrollBottom.bind(this);
  }

  componentDidMount() {
    window.addEventListener("resize", this.setThreshold.bind(this));
    this.setThreshold();
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.setThreshold.bind(this));
  }

  setThreshold() {
    this.threshold = window.innerWidth >= 800 ? 0.975 : 0.875;
  }

  getScrollBottom() {
    try {
      const ref = this.scrollbars.current!;
      
      this.top = ref.getValues().top;
    } catch (e) {
      console.log(e);
    }
  }

  autoScroll() {
    const ref = this.scrollbars.current!;

    if (this.top > this.threshold) {
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
        onScroll={this.getScrollBottom}
        renderTrackHorizontal={(props) => (
          <div {...props} className="track-horizontal" />
        )}
        renderTrackVertical={(props) => (
          <div {...props} className="track-vertical" />
        )}
        renderThumbHorizontal={(props) => (
          <div {...props} className="thumb-horizontal" />
        )}
        renderThumbVertical={(props) => (
          <div {...props} className="thumb-vertical" />
        )}
        renderView={(props) => <div {...props} className="view" />}
      >
        {this.props.children}
      </Scrollbars>
    );
  }
}

export default AvalonScrollbars;
