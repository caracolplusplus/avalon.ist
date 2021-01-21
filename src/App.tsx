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
  userSub: any = null;

  componentDidMount = () => {
    const { getAuthenticated, updateDimensions, setNotifications } = this;

    window.addEventListener('resize', updateDimensions);

    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notifications');
    } else {
      // eslint-disable-next-line no-undef
      Notification.requestPermission();
    }

    getAuthenticated();
    setNotifications();
  };

  componentWillUnmount = () => {
    const { updateDimensions } = this;

    this.userSub.unsubscribe();

    window.removeEventListener('resize', updateDimensions);
  };

  getAuthenticated = async () => {
    console.log('hello');

    const { dispatch } = this.props;

    const currentUser = Parse.User.current();
    const username = currentUser ? currentUser.getUsername()! : '';

    const userQ = new Parse.Query('_User');
    userQ.equalTo('username', username);

    this.userSub = await userQ.subscribe();

    this.userSub.on('open', () => {
      console.log(this.state);

      Parse.Cloud.run('themeRequest').then(this.updateTheme);

      Parse.Cloud.run('getAuthenticated')
        .then((state: appState) => {
          const { authenticated } = state;

          if (authenticated) {
            dispatch(setUsername(username));
            dispatch(setOnline(true));

            this.setState(state);
          } else {
            dispatch(setOnline(false));

            this.setState(state);
          }
        })
        .catch((err) => {
          console.log(err);

          Parse.User.logOut().then(() => {
            window.location.reload(true);
          });
        });
    });

    this.userSub.on('update', (user: any) => {
      const isBanned = user.get('isBanned');
      const suspensionTime = user.get('suspensionTime');

      if (isBanned || suspensionTime > Date.now()) {
        Parse.User.logOut().then(() => {
          window.location.reload(true);
        });
      }

      Parse.Cloud.run('themeRequest').then(this.updateTheme);
    });
  };

  setNotifications = async () => {
    const currentUser = Parse.User.current();
    const username = currentUser ? currentUser.getUsername()! : '';

    const messageQ = new Parse.Query('Messages');
    messageQ.equalTo('to', username);
    messageQ.equalTo('public', false);

    const messageSub = await messageQ.subscribe();

    messageSub.on('create', (message: any) => {
      const global = message.get('global');
      const code = message.get('code');
      const room = global ? 'General Chat' : `Room ${code}`;
      const from = message.get('from');
      const content = message.get('content');

      Soundboard.notification.play();

      // eslint-disable-next-line no-undef
      new Notification(`New message from ${from} in ${room}.`, {
        body: `${from} says: ${content}`,
        icon: 'https://i.ibb.co/JqQM735/login-logo.png',
        dir: 'ltr',
      });
    });
  };

  updateTheme = (style: any) => {
    const { dispatch } = this.props;

    if (!style) return;

    dispatch(updateStyle(style));
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
            <Route path="/article/:url" component={Article} />
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
