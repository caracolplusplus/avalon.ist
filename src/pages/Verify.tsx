// External

import React from 'react';

// Internal

import AvalonScrollbars from '../components/utils/AvalonScrollbars';

import Navbar from './Navbar';

// Styles

import '../styles/Verify.scss';

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
            style={{ minHeight: this.initialHeight + 'px' }}
            className="section"
          >
            <div className="welcome" />
            <h1>THE SITE IS CURRENTLY ON LOCKDOWN</h1>
            <p className="last">
              As a security measure, the site has been put on lockdown until further
              notice. This means that any account created during the lockdown will have to
              be verified before it gains access to Avalon.ist.
            </p>
            <p>
              To verify your account, please contact a moderator on Discord using the
              following link.
            </p>
          </div>
        </AvalonScrollbars>
      </div>
    );
  }
}

export default Verify;
