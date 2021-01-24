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
    const { getAuthenticated, updateDimensions, setNotifications, listenToTaunts } = this;

    window.addEventListener('resize', updateDimensions);

    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notifications');
    } else {
      // eslint-disable-next-line no-undef
      Notification.requestPermission();
    }

    getAuthenticated();
    setNotifications();
    listenToTaunts();
  };

  componentWillUnmount = () => {
    const { updateDimensions } = this;

    this.userSub.unsubscribe();

    window.removeEventListener('resize', updateDimensions);
  };

  handleParseError = (err: any) => {
    switch (err.code) {
      case Parse.Error.INVALID_SESSION_TOKEN:
        Parse.User.logOut();
        window.location.reload();
        break;
    }
  };

  getAuthenticated = async () => {
    const { dispatch } = this.props;

    const currentUser = Parse.User.current();
    const username = currentUser ? currentUser.getUsername()! : '';

    const userQ = new Parse.Query('_User');

    const userSub = await userQ.subscribe();

    userSub.on('open', () => {
      Parse.Cloud.run('generalCommands', { call: 'themeRequest' }).then(this.updateTheme);

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
            window.location.reload();
          });
        });
    });

    userSub.on('update', (user: any) => {
      console.log(user.get('username'));

      if (!user.get('isOnline'))
        Parse.Cloud.run('generalCommands', { call: 'joinPresence' });

      Parse.Cloud.run('generalCommands', { call: 'checkForBans' })
        .catch(async (err) => {
          await Parse.Cloud.run('generalCommands', { call: 'leavePresence' });

          await Parse.User.logOut();

          window.location.reload();
        })
        .catch(this.handleParseError);

      Parse.Cloud.run('generalCommands', { call: 'themeRequest' })
        .then(this.updateTheme)
        .catch(this.handleParseError);
    });

    const listsQ = new Parse.Query('Lists');

    const listSub = await listsQ.subscribe();

    listSub.on('update', (list: any) => {
      if (!currentUser) return;

      const globalActions: any = list.get('globalActions') || [[]];
      const lastGlobalAction = globalActions[globalActions.length - 1];

      if (
        lastGlobalAction.includes(username) ||
        lastGlobalAction.includes('$maintenance')
      ) {
        Parse.Cloud.run('generalCommands', { call: 'checkForBans' })
          .catch(async (err) => {
            await Parse.Cloud.run('generalCommands', { call: 'leavePresence' });

            await Parse.User.logOut();

            window.location.reload(true);
          })
          .catch(this.handleParseError);
      }
    });
  };

  setNotifications = async () => {
    const currentUser = Parse.User.current();
    const username = currentUser ? currentUser.getUsername()! : '';

    const messageQ = new Parse.Query('Message');
    messageQ.equalTo('type', 'direct');
    messageQ.equalTo('to', username);
    messageQ.equalTo('public', false);

    const messageSub = await messageQ.subscribe();

    messageSub.on('create', (message: any) => {
      const global = message.get('global');
      const code = message.get('code');
      const room = global ? 'General Chat' : `Game /${code}`;
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

  listenToTaunts = async () => {
    const currentUser = Parse.User.current();
    const username = currentUser ? currentUser.getUsername()! : '';

    const tauntQ = new Parse.Query('Taunt');
    tauntQ.equalTo('to', username);

    const tauntSub = await tauntQ.subscribe();

    tauntSub.on('create', (taunt: any) => {
      const global = taunt.get('global');
      const code = taunt.get('code');
      const room = global ? 'General Chat' : `Room ${code}`;
      const from = taunt.get('from');
      const audio: string = taunt.get('audio');

      const tauntSelect: {
        [x: string]: any;
      } = {
        slapped: 'slapped',
        notification: 'buzzed',
        licked: 'licked',
      };

      const tauntName = tauntSelect[audio];

      if (Soundboard[audio]) Soundboard[audio].play();

      // eslint-disable-next-line no-undef
      new Notification(`You have been ${tauntName} by ${from}.`, {
        body: `${from} is on ${room}.`,
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
