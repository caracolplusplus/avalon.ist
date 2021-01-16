// External

import React from 'react';
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { Dispatch } from 'redux';
import { connect } from 'react-redux';

// Routes

import Parse from './parse/parse';
import LoggedInOnly from './components/routes/LoggedInOnly';
import LoggedOutOnly from './components/routes/LoggedOutOnly';
import UnverifiedOnly from './components/routes/UnverifiedOnly';

// Redux

import { setUsername, setOnline, updateStyle } from './redux/actions';

// Pages

import Login from './pages/Login';
import Signup from './pages/Signup';
import Verify from './pages/Verify';
import Lobby from './pages/Lobby';
import Profile from './pages/Profile';
import Game from './pages/Game';
import Article from './pages/Article';
import NoMatch from './pages/NoMatch';

import Soundboard from './sounds/audio';

// Types

declare global {
  interface Window {
    msRequestAnimationFrame: any;
    mozRequestAnimationFrame: any;
    mozCancelAnimationFrame: any;
  }
}

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
  state = initialState;
  envSub: any = null;

  componentDidMount = () => {
    const { getAuthenticated, listenForStyles, updateDimensions } = this;

    window.addEventListener('resize', updateDimensions);

    listenForStyles();

    getAuthenticated();
  };

  componentWillUnmount = () => {
    const { updateDimensions } = this;

    this.envSub.unsubscribe();

    window.removeEventListener('resize', updateDimensions);
  };

  getAuthenticated = async () => {
    const { dispatch } = this.props;

    const envQ = new Parse.Query('Environment');

    this.envSub = await envQ.subscribe();

    this.envSub.on('open', () => {
      console.log(this.state);

      Parse.Cloud.run('getAuthenticated').then((state: appState) => {
        const { authenticated } = state;

        if (authenticated) {
          const currentUser = Parse.User.current()!;

          const username = currentUser.getUsername()!;

          dispatch(setUsername(username));
          dispatch(setOnline(true));

          this.setState(state);

          this.envSub.on('close', () => {
            Parse.Cloud.run('leavePresence');
          });
        } else {
          dispatch(setOnline(false));

          this.setState(state);
        }
      });
    });
  };

  setNotifications = () => {
    const printNotification = (data: any) => {
      // This is broken
      if (Soundboard[data.audio]) Soundboard[data.audio].play();

      // eslint-disable-next-line no-undef
      new Notification(data.title, {
        body: data.body,
        icon: 'https://i.ibb.co/kGHXzYr/favicon-32x32.png',
        dir: 'ltr',
      });
    };

    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notifications');
    } else {
      // eslint-disable-next-line no-undef
      Notification.requestPermission();
    }
  };

  listenForKicks = () => {
    const reloadPage = async () => {
      await Parse.User.logOut();

      window.location.reload(true);
    };
  };

  listenForStyles = () => {
    const updateTheme = (style: any) => {
      const { dispatch } = this.props;

      dispatch(updateStyle(style));
    };
  };

  listenForLogs = () => {
    const printLogs = (data: any) => {
      console.log(data);
    };
  };

  updateDimensions = () => {
    const { innerWidth, innerHeight } = window;

    this.setState({ width: innerWidth, height: innerHeight });
  };

  render() {
    const { loading, authenticated, verified, width, height } = this.state;

    const routeProps = { authenticated, verified };

    const e = (
      <>
        <Router>
          <Switch>
            <LoggedOutOnly
              exact
              path="/"
              authenticated={authenticated}
              component={Login}
            />
            <LoggedOutOnly
              exact
              path="/signup"
              authenticated={authenticated}
              component={Signup}
            />
            <UnverifiedOnly exact path="/verify" {...routeProps} component={Verify} />
            <LoggedInOnly exact path="/lobby" {...routeProps} component={Lobby} />
            <LoggedInOnly path="/profile/:username" {...routeProps} component={Profile} />
            <LoggedInOnly path="/game/:gameId" {...routeProps} component={Game} />
            <Route path="/article/:id" component={Article} />
            <Route component={NoMatch} />
          </Switch>
        </Router>
        <span style={{ display: 'none' }}>
          Window size: {width} x {height}
        </span>
      </>
    );

    return loading === true ? null : e;
  }
}

export default connect(null, null)(App);
