// External

import React from "react";

// Internal

import AvalonScrollbars from "../components/utils/AvalonScrollbars";

import Navbar from "./Navbar";

// Styles

import "../styles/Verify.scss";

// Declaration

class Verify extends React.PureComponent {
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
            <div className="welcome" />
            <h2>WELCOME TO AVALON.IST</h2>
            <p>
              You have received an email with a confirmation link. If you do not
              see the email, please check your junk or spam folders. Contact a
              moderator if you experience any issues. Refresh the page after
              verification.
            </p>
          </div>
        </AvalonScrollbars>
      </div>
    );
  }
}

export default Verify;
