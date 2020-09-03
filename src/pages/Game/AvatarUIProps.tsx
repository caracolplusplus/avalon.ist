import Table from './Table';

interface AvatarUIProps {
  spyUrl: string;
  resUrl: string;
  username: string;
  onMission: boolean;
  leader: boolean;
  hammer: boolean;
  card: boolean;
  isRes: boolean;
  isPickable: boolean;
  role: string;
  vote: number;
  table: Table;
  killed: boolean;
  afk: boolean;
  isMe: boolean;
}

type AvatarUIPropsType = AvatarUIProps;

export default AvatarUIPropsType;