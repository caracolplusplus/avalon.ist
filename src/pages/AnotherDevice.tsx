// External

import React from 'react';
import { connect } from 'react-redux';
// eslint-disable-next-line no-unused-vars
import { rootType } from '../redux/reducers';

// Internal

import AvalonScrollbars from '../components/utils/AvalonScrollbars';

// Styles

import '../styles/Verify.scss';

// Declaration

interface PageProps {
  style?: any;
}

const mapState = (state: rootType) => {
  const { style } = state;
  return { style };
};

class NoMatch extends React.PureComponent<PageProps> {
  initialHeight = window.innerHeight;

  render() {
    const theme = this.props.style.themeLight ? 'light' : 'dark';

    return (
      <div id="Background-2" className={'full ' + theme}>
        <AvalonScrollbars>
          <div
            id="Verify"
            style={{ minHeight: this.initialHeight + 'px' }}
            className="section"
          >
            <div className="not-found" />
            <h1>YOU HAVE LOGGED IN FROM ANOTHER INSTANCE.</h1>
            <p>If you want to play in this instance, reload the page.</p>
          </div>
        </AvalonScrollbars>
      </div>
    );
  }
}

export default connect(mapState, null)(NoMatch);
