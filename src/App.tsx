// External

import React from 'react';
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';

// Routes

import Parse from './parse/parse';
import socket from './socket-io/socket-io';
import LoggedInOnly from './components/routes/LoggedInOnly';
import LoggedOutOnly from './components/routes/LoggedOutOnly';
import UnverifiedOnly from './components/routes/UnverifiedOnly';

// Redux

import { setUsername, setOnline } from './redux/actions';

// Pages

import Login from './pages/Login';
import Signup from './pages/Signup';
import Verify from './pages/Verify';
import Lobby from './pages/Lobby';
import Profile from './pages/Profile';
import Game from './pages/Game';
import NoMatch from './pages/NoMatch';

// Types

interface appProps {
  dispatch: Dispatch;
}

interface appState {
  authenticated: boolean;
  verified: boolean;
  loading: boolean;
  width: number;
  height: number;
}

const initialState: appState = {
  authenticated: false,
  verified: false,
  loading: true,
  width: 0,
  height: 0,
};

// App

class App extends React.PureComponent<appProps, appState> {
  constructor(props: appProps) {
    super(props);
    this.state = initialState;
    this.updateState = this.updateState.bind(this);
    this.updateDimensions = this.updateDimensions.bind(this);
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateDimensions);

    socket.on('showModerationLogs', (data: any) => {
      const logstring = JSON.stringify(data);
      alert(logstring);

      console.log(data);
    });

    socket.on('connectionStarted', this.authStateChange);
    socket.on('connectionLinked', this.updateState);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateDimensions);

    socket.disconnect();
  }

  async authStateChange() {
    try {
      await Parse.Cloud.run('authStateChange');
    } catch (err) {
      await Parse.User.logOut();
      window.location.reload();
    }
  }

  updateState() {
    const currentUser = Parse.User.current();

    if (currentUser) {
      const username = currentUser.getUsername();

      this.props.dispatch(setUsername(username ? username : '-'));
      this.props.dispatch(setOnline(true));

      this.setState({
        authenticated: true,
        verified: true,
        loading: false,
      });

      socket.emit('parseLink');
    } else {
      this.props.dispatch(setOnline(false));

      this.setState({
        authenticated: false,
        verified: false,
        loading: false,
      });

      socket.emit('parseUnlink');
    }
  }

  updateDimensions() {
    this.setState({ width: window.innerWidth, height: window.innerHeight });
  }

  render() {
    return this.state.loading === true ? null : (
      <>
        <Router>
          <Switch>
            <LoggedOutOnly exact path="/" authenticated={this.state.authenticated} component={Login} />
            <LoggedOutOnly exact path="/signup" authenticated={this.state.authenticated} component={Signup} />
            <UnverifiedOnly
              exact
              path="/verify"
              authenticated={this.state.authenticated}
              verified={false}
              component={Verify}
            />
            <LoggedInOnly
              exact
              path="/lobby"
              authenticated={this.state.authenticated}
              verified={this.state.verified}
              component={Lobby}
            />
            <LoggedInOnly
              path="/profile/:username"
              authenticated={this.state.authenticated}
              verified={this.state.verified}
              component={Profile}
            />
            <LoggedInOnly
              path="/game/:id"
              authenticated={this.state.authenticated}
              verified={this.state.verified}
              component={Game}
            />
            <Route component={NoMatch} />
          </Switch>
        </Router>
        <span style={{ display: 'none' }}>
          Window size: {this.state.width} x {this.state.height}
        </span>
      </>
    );
  }
}

export default connect(null, null)(App);
