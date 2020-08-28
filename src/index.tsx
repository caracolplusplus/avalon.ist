// External

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
			<App online={true} dispatch={useDispatch} />
		</Provider>
	</React.StrictMode>,
	document.getElementById('root')
);
