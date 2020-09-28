// External

import { combineReducers } from "redux";

// Types

import { ADD_NOTES, SET_USERNAME, SET_ONLINE, SET_GAME_TAB_HIGHLIGHT, UPDATE_CHAT_HIGHLIGHT, ActionTypes } from "./actions";

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

function highlighted(state: boolean[] = [false, false, false, false, false], action: ActionTypes): boolean[] {
	switch (action.type) {
		case SET_GAME_TAB_HIGHLIGHT:
			state[action.index] = action.value;
			return state;
		default:
			return state;
	}
}

function chatHighlights(state: { [key: string]: string } = {}, action: ActionTypes): { [key: string]: string } {
	switch (action.type) {
		case UPDATE_CHAT_HIGHLIGHT:
			const newState = { ...state };
			newState[action.player] = action.color;
			return newState;
		default:
			return state;
	}
}

export const rootReducer = combineReducers({
	notes,
	username,
	online,
	highlighted,
	chatHighlights
});

export type rootType = ReturnType<typeof rootReducer>;
