import {
  GameArea,
  GameStatus,
  VehicleTrickGameState,
  VehicleType,
} from '../../types/CoveyTownSocket';
import PlayerController from '../PlayerController';
import GameAreaController, {
  GameEventTypes,
  NO_GAME_IN_PROGRESS_ERROR,
} from './GameAreaController';

export type VehicleTrickEvents = GameEventTypes & {
  targetWordChanged: (newWord: string) => void;
  scoreChanged: (newScore: number) => void;
};

/**
 * Class responsible for managing the state of the Vehicle Trick game, and for sending commands to the server.
 */
export default class VehicleTrickAreaController extends GameAreaController<
  VehicleTrickGameState,
  VehicleTrickEvents
> {
  private _currentWord = '';

  private _currentScore = 0;

  private _currentTimeLeft = 15;

  /**
   * Returns the player's current target word.
   */
  get currentWord(): string {
    return this._currentWord;
  }

  /**
   * Returns the player's current score.
   */
  get currentScore(): number {
    return this._currentScore;
  }

  /**
   * Returns the time left in the game.
   */
  get currentTimeLeft(): number {
    return this._currentTimeLeft;
  }

  /**
   * Returns true if our player is a player in this game.
   */
  get isPlayer(): boolean {
    return this._model.game?.players.includes(this._townController.ourPlayer.id) || false;
  }

  /**
   * Returns true if the trick game is in progress.
   * @returns true if the trick game is in progress, false otherwise
   */
  public isActive(): boolean {
    return this._model.game?.state.status === 'IN_PROGRESS';
  }

  /**
   * Returns the status of the game.
   * Defaults to 'WAITING_TO_START' if the game is not in progress
   */
  get status(): GameStatus {
    const status = this._model.game?.state.status;
    if (!status) {
      return 'WAITING_TO_START';
    }
    return status;
  }

  /**
   * Determines if ourPlayer can play the vehicle trick game.
   * Right now, they can only play if they have a vehicle equipped.
   */
  get canPlay(): boolean {
    return this._townController.ourPlayer.vehicle !== undefined || false;
  }

  /**
   * Updates the internal state of this controller to match the new model.
   * Emits a 'scoreChanged' event with the new score if the score changed, and
   * Emits a 'targetWordChanged' event with the new target word if the target word changed.
   * Emits a 'timeLeftChanged' event with the new time left if the time left changed.
   * @param newModel the new model to update the controller with
   */
  protected _updateFrom(newModel: GameArea<VehicleTrickGameState>): void {
    super._updateFrom(newModel);
    const newState = newModel.game;
    if (newState) {
      const newScore = newState.state.currentScore;
      const newWord = newState.state.targetWord;
      const newTimeLeft = newState.state.timeLeft;
      if (this._currentTimeLeft !== newTimeLeft) {
        this._currentTimeLeft = newTimeLeft;
        this.emit('timeLeftChanged', newTimeLeft);
      }
      if (this._currentScore !== newScore) {
        this._currentScore = newScore;
        if (newScore > 0) {
          this._playTrickAnimation();
        }
        this.emit('scoreChanged', newScore);
      }
      if (this._currentWord !== newWord) {
        this._currentWord = newWord;
        this.emit('targetWordChanged', newWord);
      }
    }
  }

  /**
   * Sends a request to the server to enter a new guess in the game.
   * @param word The word that the player entered
   * @throws Error if the current game is not in progress or
   *         if the game instance IDs don't match
   */
  public async enterWord(word: string) {
    const instanceID = this._instanceID;
    if (!instanceID || this._model.game?.state.status !== 'IN_PROGRESS') {
      throw new Error(NO_GAME_IN_PROGRESS_ERROR);
    }
    await this._townController.sendInteractableCommand(this.id, {
      type: 'GameMove',
      gameID: instanceID,
      move: {
        word,
      },
    });
  }

  /**
   * Ends the vehicle trick game after the user enters their initials.
   * @param userInitials The user's entered initials
   */
  public async gameEnded(userInitials: string) {
    await this._townController.sendInteractableCommand(this.id, {
      type: 'GameEnded',
      playerInitials: userInitials,
    });
  }

  /**
   * Plays a random trick animation for the player.
   */
  private async _playTrickAnimation() {
    const player = this._player;
    if (player && player.gameObjects) {
      const { sprite } = player.gameObjects;
      const vehicleType: VehicleType | undefined = player.vehicle?.vehicleType;
      const trickNumber: number =
        vehicleType === 'skateboard' ? Math.floor(Math.random() * 3) + 1 : 1;
      sprite.anims.play(`${vehicleType}-trick-${trickNumber}`, true);
    }
  }

  /**
   * Returns the player playing the game if there is one, or undefined otherwise
   */
  private get _player(): PlayerController | undefined {
    const player = this._model.game?.state.player;
    if (player) {
      return this.occupants.find(eachOccupant => eachOccupant.id === player);
    }
    return undefined;
  }
}
