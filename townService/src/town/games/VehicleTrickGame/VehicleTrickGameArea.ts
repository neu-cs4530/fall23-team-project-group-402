import InvalidParametersError, {
  GAME_ID_MISSMATCH_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  INVALID_COMMAND_MESSAGE,
} from '../../../lib/InvalidParametersError';
import Player from '../../../lib/Player';
import {
  InteractableType,
  InteractableCommand,
  InteractableCommandReturnType,
  VehicleTrickMove,
  GameInstance,
  VehicleTrickGameState,
} from '../../../types/CoveyTownSocket';
import GameArea from '../GameArea';
import VehicleTrickGame from './VehicleTrickGame';

/**
 * A VehicleTrickGameArea is a GameArea that hosts a VehicleTrickGame.
 * @see VehicleTrickGame
 * @see GameArea
 */
export default class VehicleTrickGameArea extends GameArea<VehicleTrickGame> {
  protected getType(): InteractableType {
    return 'VehicleTrickArea';
  }

  private _stateUpdated(
    updatedState: GameInstance<VehicleTrickGameState>,
    playerInitials: string | null = null,
  ) {
    if (updatedState.state.status === 'OVER') {
      /* TODO: Abhay, this history is just the current game instance's history.
        For persistent storage, we will need to make a network request here if the user's
        score is in the top 10. Maybe we show two leaderboard in the component: one for
        the current session leaderboard (like in TicTacToe) and one for the top 10 all time.
      */

      // If we haven't yet recorded the outcome, do so now.
      const gameID = this._game?.id;
      if (gameID && !this._history.find(eachResult => eachResult.gameID === gameID)) {
        const { player, currentScore } = updatedState.state;
        if (player) {
          let playerName =
            this._occupants.find(eachPlayer => eachPlayer.id === player)?.userName || player;
          if (playerInitials !== null) {
            playerName = playerInitials;
          }
          this._history.push({
            gameID,
            scores: {
              [playerName]: currentScore,
            },
          });
        }
      }
    }
    this._emitAreaChanged();
  }

  /**
   * Handles a command from a player in this game area.
   * @param command command to handle
   * @param player player making the request
   * @returns response to the command, @see InteractableCommandResponse
   */
  public handleCommand<CommandType extends InteractableCommand>(
    command: CommandType,
    player: Player,
  ): InteractableCommandReturnType<CommandType> {
    if (command.type === 'GameMove') {
      const game = this._game;
      if (!game) {
        throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
      }
      if (this._game?.id !== command.gameID) {
        throw new InvalidParametersError(GAME_ID_MISSMATCH_MESSAGE);
      }
      game.applyMove({
        gameID: command.gameID,
        playerID: player.id,
        move: command.move as VehicleTrickMove,
      });
      this._stateUpdated(game.toModel());
      return undefined as InteractableCommandReturnType<CommandType>;
    }
    if (command.type === 'JoinGame') {
      let game = this._game;
      if (!game || game.state.status === 'OVER') {
        // No game in progress, make a new one
        game = new VehicleTrickGame();
        this._game = game;
      }
      game.join(player);
      this._stateUpdated(game.toModel());
      return { gameID: game.id } as InteractableCommandReturnType<CommandType>;
    }
    if (command.type === 'LeaveGame') {
      const game = this._game;
      if (!game) {
        throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
      }
      if (this._game?.id !== command.gameID) {
        throw new InvalidParametersError(GAME_ID_MISSMATCH_MESSAGE);
      }
      game.leave(player);
      this._stateUpdated(game.toModel());
      return undefined as InteractableCommandReturnType<CommandType>;
    }
    if (command.type === 'GameEnded') {
      const game = this._game;
      if (!game) {
        throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
      }
      this._stateUpdated(game.toModel(), command.playerInitials);
    }
    throw new InvalidParametersError(INVALID_COMMAND_MESSAGE);
  }
}
