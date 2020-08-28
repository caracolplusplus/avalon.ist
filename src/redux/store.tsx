// External

import { createStore } from "redux";

// Root

import { rootReducer } from "./reducers";

const store = createStore(rootReducer);
export default store;
