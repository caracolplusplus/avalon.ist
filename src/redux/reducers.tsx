// External

import { combineReducers } from 'redux';

// Types

import {
  ADD_NOTES,
  SET_USERNAME,
  SET_ONLINE,
  SET_GAME_TAB_HIGHLIGHT,
  UPDATE_CHAT_HIGHLIGHT,
  SET_MESSAGE_DELAY,
  UPDATE_STYLE,
  SET_MISSION_HIGHLIGHT,
  // eslint-disable-next-line no-unused-vars
  ActionTypes,
} from './actions';

// Reducers

function notes(state = '', action: ActionTypes): string {
  switch (action.type) {
    case ADD_NOTES:
      return action.text;
    default:
      return state;
  }
}

function username(state = '', action: ActionTypes): string {
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

function highlighted(
  state: boolean[] = [false, false, false, false, false],
  action: ActionTypes
): boolean[] {
  switch (action.type) {
    case SET_GAME_TAB_HIGHLIGHT:
      state[action.index] = action.value;
      return state;
    default:
      return state;
  }
}

function chatHighlights(
  state: { [key: string]: string } = {},
  action: ActionTypes
): { [key: string]: string } {
  switch (action.type) {
    case UPDATE_CHAT_HIGHLIGHT:
      // eslint-disable-next-line no-case-declarations
      const newState = { ...state };
      newState[action.player] = action.color;
      return newState;
    default:
      return state;
  }
}

function messageDelay(state: number[] = [0, 0, 0, 0, 0], action: ActionTypes): number[] {
  switch (action.type) {
    case SET_MESSAGE_DELAY:
      state.push(action.timestamp);
      state.shift();
      return state;
    default:
      return state;
  }
}

function missionHighlight(
  state: { mission: number; round: number } = { mission: -1, round: -1 },
  action: ActionTypes
): { mission: number; round: number } {
  switch (action.type) {
    case SET_MISSION_HIGHLIGHT:
      return {
        mission: action.mission,
        round: action.round,
      };
    default:
      return state;
  }
}

/* Set the same starting value on profile */

function style(
  state: any = {
    playArea: 1,
    playTabs: 2,
    playFontSize: 12,
    avatarSize: 75,
    avatarStyle: true,
    themeLight: false,
    coloredNames: true,
    numberOfMessages: 5,
  },
  action: ActionTypes
): any {
  switch (action.type) {
    case UPDATE_STYLE:
      state = action.style;
      return state;
    default:
      return state;
  }
}

export const rootReducer = combineReducers({
  notes,
  username,
  online,
  highlighted,
  chatHighlights,
  messageDelay,
  style,
  missionHighlight,
});

export type rootType = ReturnType<typeof rootReducer>;
