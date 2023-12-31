import { TextChannel, User } from 'discord.js';
import Constants from '../../common/constants';
import { Plugin } from '../../common/plugin';
import { ChannelType, IContainer, IMessage, Maybe } from '../../common/types';
import { GameType } from '../../services/gameleaderboard.service';

export default class LeaderboardPlugin extends Plugin {
  public commandName: string = 'leaderboard';
  public name: string = 'Leaderboard Plugin';
  public description: string = 'Gets the leaderboards of games';
  public usage: string = 'leaderboard <game (optional)>';
  public override pluginAlias = ['lb'];
  public permission: ChannelType = ChannelType.Public;
  public override pluginChannelName = Constants.Channels.Public.Games;

  public override validate(_message: IMessage, args: string[]) {
    return args.length >= 1;
  }

  constructor(public container: IContainer) {
    super();
  }

  public async execute(message: IMessage, args: string[]) {
    const [gameName] = args;
    const [opponentOne, opponentTwo] = message.mentions.users.values()!;
    const gameEnum: Maybe<GameType> = this._getGameType(gameName);
    if (!gameEnum) {
      await message.reply('Couldn\'t find that game');
      return;
    }

    const guild = message.guild;
    if (!guild) {
      await message.reply('Please use this command in a guild');
      return;
    }

    // Get default leaderboard if no users are given
    if (!opponentOne) {
      const embed = await this.container.gameLeaderboardService.createOverallLeaderboardEmbed(
        message.author,
        gameEnum
      );

      await this.container.messageService.sendStringOrEmbed(message.channel as TextChannel, embed);
      return;
    }

    // Give one players leaderboard if no opponent is given
    if (!opponentTwo) {
      const embed = await this._createOpponentPlayerEmbed(message, opponentOne, gameEnum);
      await this.container.messageService.sendStringOrEmbed(message.channel as TextChannel, embed);
      return;
    }

    const embed = await this._getMatchUpEmbed(opponentOne, opponentTwo, gameEnum);
    await this.container.messageService.sendStringOrEmbed(message.channel as TextChannel, embed);
  }

  private async _createOpponentPlayerEmbed(
    message: IMessage,
    opponent: User,
    gameEnum: GameType
  ) {

    return this.container.gameLeaderboardService.createMatchupLeaderboardEmbed(
      message.author,
      opponent,
      gameEnum
    );
  }

  private _getMatchUpEmbed(
    playerOne: User,
    playerTwo: User,
    gameEnum: GameType
  ) {

    return this.container.gameLeaderboardService.createMatchupLeaderboardEmbed(
      playerOne,
      playerTwo,
      gameEnum
    );
  }

  private _getGameType(gameName: string): Maybe<GameType> {
    const gameAliases = this.container.gameLeaderboardService.gameAliases;
    if (gameAliases[GameType.TicTacToe].includes(gameName)) {
      return GameType.TicTacToe;
    }

    if (gameAliases[GameType.ConnectFour].includes(gameName)) {
      return GameType.ConnectFour;
    }

    return null;
  }
}
