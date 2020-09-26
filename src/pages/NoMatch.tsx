// External

import React from 'react'

// Internal

import AvalonScrollbars from "../components/utils/AvalonScrollbars";

import Navbar from "./Navbar";

// Styles

import "../styles/Verify.scss";

// Declaration

class NoMatch extends React.PureComponent {
  initialHeight = window.innerHeight;

  render() {
    return (
      <div id="Background-2" className="dark full">
        <Navbar username="" />
        <AvalonScrollbars>
          <div
            id="Verify"
            style={{ minHeight: this.initialHeight + "px" }}
            className="section"
          >
            <div className="not-found" />
            <h2>THE SPIES HAVE STOLEN THIS PAGE.</h2>
            <p>
              404. Page not found.
            </p>
          </div>
        </AvalonScrollbars>
      </div>
    );
  }
}

export default NoMatch
