import Table from './Table';

interface AvatarUIProps {
  spyUrl: string;
  resUrl: string;
  username: string;
  role: string;
  vote: number;
  leader: boolean;
  hammer: boolean;
  killed: boolean;
  card: boolean;
  afk: boolean;
  onMission: boolean;
  isMe: boolean;
  isRes: boolean;
  isPickable: boolean;
  table: Table | null;
  tableWidth: number;
  shieldPosition: [number, number];
  shieldScale: number;
  shieldShow: boolean;
  avatarInitialPosition: [number, number];
  avatarPosition: [number, number];
  avatarShow: boolean;
  avatarSize: number;
}

type AvatarUIPropsType = AvatarUIProps;

export default AvatarUIPropsType;
