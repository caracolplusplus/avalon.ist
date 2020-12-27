interface GameState {
  // Player Info
  username: string | null;
  players: string[];
  claimed: string[];
  avatars: any[];
  clients: string[];
  kicked: boolean;
  askedToBeReady: boolean;
  seat: number;
  imRes: boolean;
  // Game State Info
  active: boolean;
  started: boolean | undefined;
  ended: boolean | undefined;
  frozen: boolean | undefined;
  stage: string | undefined;
  cause: number | undefined;
  assassination: number;
  // Game UI Info
  style: any;
  highlighted: boolean[];
  notFound: boolean;
  // Game Pick Info
  picks: number[];
  picksYetToVote: number[];
  votesRound: number[];
  // Game Knowledge
  publicKnowledge: string[];
  privateKnowledge: string[];
  // Game Power Positions
  leader: number;
  hammer: number;
  card: number;
  assassin: boolean;
  assassinName: string;
  // Game Mission Info
  mission: number;
  round: number;
  // Past Game Info
  results: boolean[];
  cardHolders: number[];
  missionLeader: number[][];
  missionVotes: number[][][];
  missionTeams: number[][][];
  // Room Number
  code: string;
  // Game Settings
  playerMax: number;
  roleSettings: {
    merlin: boolean;
    percival: boolean;
    morgana: boolean;
    assassin: boolean;
    oberon: boolean;
    mordred: boolean;
    lady: boolean;
  };
}

type GameStateType = GameState;

// eslint-disable-next-line no-undef
export default GameStateType;
