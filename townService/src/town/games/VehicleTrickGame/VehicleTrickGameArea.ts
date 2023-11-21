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
  BoundingBox,
  TownEmitter,
  VehicleTrickScore,
  GameResult,
} from '../../../types/CoveyTownSocket';
import GameArea from '../GameArea';
import VehicleTrickGame from './VehicleTrickGame';
import VehicleTrickService from './VehicleTrickService';

/**
 * A VehicleTrickGameArea is a GameArea that hosts a VehicleTrickGame.
 * @see VehicleTrickGame
 * @see GameArea
 */
export default class VehicleTrickGameArea extends GameArea<VehicleTrickGame> {
  private _vehicleTrickService: VehicleTrickService;

  constructor(
    id: string,
    rect: BoundingBox,
    townEmitter: TownEmitter,
    vehicleTrickService: VehicleTrickService = new VehicleTrickService(),
  ) {
    super(id, rect, townEmitter);
    this._vehicleTrickService = vehicleTrickService;
    this._loadAllTimeHistory();
  }

  protected getType(): InteractableType {
    return 'VehicleTrickArea';
  }

  /**
   * Loads the all-time history for the vehicle trick game.
   */
  private _loadAllTimeHistory(): void {
    this._vehicleTrickService.getTopScores().then(scores => {
      this._allTimeHistory = this._trickScoresToGameResult(scores, '');
      this._emitAreaChanged();
    });
  }

  private _stateUpdated(
    updatedState: GameInstance<VehicleTrickGameState>,
    playerInitials: string | null = null,
  ) {
    if (updatedState.state.status === 'OVER') {
      // If we haven't yet recorded the outcome, do so now.
      const gameID = this._game?.id;
      if (gameID && !this._history.find(eachResult => eachResult.gameID === gameID)) {
        const { player, currentScore } = updatedState.state;
        if (player) {
          let playerName =
            this._occupants.find(eachPlayer => eachPlayer.id === player)?.userName || player;
          if (playerInitials !== null) {
            playerName = playerInitials;

            // Update the all-time history
            const score: VehicleTrickScore = { initials: playerName, score: currentScore };
            this._vehicleTrickService.addScore(score).then(scores => {
              this._allTimeHistory = this._trickScoresToGameResult(scores, gameID);
              this._emitAreaChanged();
            });
          }

          // Add to the current session's history
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

  private _trickScoresToGameResult(scores: VehicleTrickScore[], gameID: string): GameResult[] {
    return scores.map(score => ({
      gameID,
      scores: {
        [score.initials]: score.score,
      },
    }));
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
      game.leave(player);
      this._stateUpdated(game.toModel(), command.playerInitials);
      return undefined as InteractableCommandReturnType<CommandType>;
    }
    throw new InvalidParametersError(INVALID_COMMAND_MESSAGE);
  }
}
