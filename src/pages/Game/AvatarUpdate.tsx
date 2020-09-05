import AvatarUIProps from './AvatarUIProps';

export default function AvatarUpdate() {
  self.addEventListener(
    'message',
    (e) => {
      if (!e) return;

      const game = e.data;

      const left: AvatarUIProps[] = [];
      const top: AvatarUIProps[] = [];
      const right: AvatarUIProps[] = [];
      const bot: AvatarUIProps[] = [];

      const players = [...game.players];

      for (let i = 0; i < players.length; i++) {
        const res = ['Resistance?', 'Resistance', 'Percival', 'Merlin', 'Merlin?'];
        const knowledge =
          game.privateKnowledge.length > 0 && game.ended !== true
            ? [...game.privateKnowledge]
            : [...game.publicKnowledge];

        // Pre Conditions
        const imKilling = game.assassin && game.stage === 'ASSASSINATION';
        const imPicking = game.seat === game.leader && game.stage === 'PICKING';
        const imCarding = game.seat === game.card && game.stage === 'CARDING';
        const imVoting = game.stage === 'VOTING';

        // Avatars
        const spyUrl = 'https://cdn.discordapp.com/attachments/612734001916018707/736446594936733786/base-spy.png';
        const resUrl = 'https://cdn.discordapp.com/attachments/688596182758326313/732067339746541628/base-res.png';

        // Data
        const username = players[i];
        const role = knowledge[i];
        const vote = imVoting ? -1 : game.votesRound[i];
        const leader = game.leader === i || (game.started === false && i === 0);
        const hammer = game.hammer === i;
        const card = game.card === i;
        const isRes = res.includes(knowledge[i]);
        const isPickable = imPicking || imKilling || imCarding;
        const onMission = game.picks.includes(i);
        const killed = game.assassination === i;
        const afk = !game.clients.includes(username);

        const e: AvatarUIProps = {
          spyUrl,
          resUrl,
          username,
          role,
          vote,
          leader,
          hammer,
          card,
          isRes,
          isPickable,
          onMission,
          table: null,
          killed,
          afk,
          isMe: game.seat === i,
        };

        const l = Math.floor(players.length / 2);
        if (players.length < 4) {
          switch (i) {
            case 0:
              top.push(e);
              break;
            default:
              bot.push(e);
              break;
          }
        } else {
          switch (i) {
            case 0:
              left.push(e);
              break;
            case l:
              right.push(e);
              break;
            default:
              i < l ? top.push(e) : bot.push(e);
              break;
          }
        }
      }

      postMessage({
        left,
        top,
        right,
        bot,
      });
    },
    false
  );
}
