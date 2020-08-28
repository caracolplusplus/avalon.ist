// External

import { combineReducers } from "redux";

// Types

import { ADD_NOTES, SET_USERNAME, SET_ONLINE, ActionTypes } from "./actions";

// Reducers

function notes(state = "", action: ActionTypes): string {
	switch (action.type) {
		case ADD_NOTES:
			return action.text;
		default:
			return state;
	}
}

function username(state = "", action: ActionTypes): string {
	switch (action.type) {
		case SET_USERNAME:
			return action.text;
		default:
			return state;
	}
}

function online(state: boolean = false, action: ActionTypes): boolean {
	switch (action.type) {
		case SET_ONLINE:
			return action.value;
		default:
			return state;
	}
}

export const rootReducer = combineReducers({
	notes,
	username,
	online
});

export type rootType = ReturnType<typeof rootReducer>;
