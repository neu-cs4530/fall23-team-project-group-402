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
    this._loadPersistentHistory();
  }

  /**
   * Gets the type of this GameArea.
   * @returns The type of this Interactable area.
   */
  protected getType(): InteractableType {
    return 'VehicleTrickArea';
  }

  /**
   * Loads the persistent history for the vehicle trick game.
   */
  private _loadPersistentHistory(): void {
    this._vehicleTrickService.getTopScores().then(scores => {
      this._persistentHistory = this._trickScoresToGameResult(scores, '');
      this._emitAreaChanged();
    });
  }

  /**
   * Handles updating the state and emmitting events based on certain
   * state changes.
   * @param updatedState The updated state of the game
   * @param playerInitials The player's entered initials, if any
   */
  private _stateUpdated(
    updatedState: GameInstance<VehicleTrickGameState>,
    playerInitials: string | null = null,
  ) {
    if (updatedState.state.status === 'OVER') {
      // If we haven't yet recorded the outcome, do so now.
      const gameID = this._game?.id;
      if (gameID && !this._localHistory.find(eachResult => eachResult.gameID === gameID)) {
        const { player, currentScore } = updatedState.state;
        if (player) {
          let playerName =
            this._occupants.find(eachPlayer => eachPlayer.id === player)?.userName || player;
          if (playerInitials !== null) {
            playerName = playerInitials;

            // Update the all-time history
            const score: VehicleTrickScore = { initials: playerName, score: currentScore };
            this._vehicleTrickService.addScore(score).then(scores => {
              this._persistentHistory = this._trickScoresToGameResult(scores, gameID);
              this._emitAreaChanged();
            });

            // Add to the current session's history
            this._localHistory.push({
              gameID,
              scores: {
                [playerName]: currentScore,
              },
            });
          }
        }
      }
    }
    this._emitAreaChanged();
  }

  /**
   * Maps VehicleTrickScores to GameResults for the game's history.
   * @param scores The scores in the game
   * @param gameID The gameID the scores were in
   * @returns The GameResults representing the scores
   */
  private _trickScoresToGameResult(scores: VehicleTrickScore[], gameID: string): GameResult[] {
    return scores.map(score => ({
      gameID,
      scores: {
        [score.initials]: score.score,
      },
    }));
  }

  /**
   * Increments the game's timer.
   */
  private _incrementTimer(): void {
    const game = this._game;
    if (!game) {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    }
    game.iterateClock();
    this._stateUpdated(game.toModel());
  }

  /**
   * Starts the game's timer.
   */
  private _startTimer() {
    const intervalId = setInterval(() => {
      if (this.game && this.game.state.status === 'IN_PROGRESS' && this.game.state.timeLeft > 0) {
        this._incrementTimer();
      } else if (!this.game) {
        throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
      } else {
        clearInterval(intervalId);
      }
    }, 1000);
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
      this._startTimer();
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
