// External

import 'react-app-polyfill/ie9';
import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider, useDispatch } from 'react-redux';

// Internal

import App from './App';
import store from './redux/store';

// Render

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <App dispatch={useDispatch} />
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);
