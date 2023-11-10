import { GameArea, VehicleTrickGameState } from '../../types/CoveyTownSocket';
import GameAreaController, {
  GameEventTypes,
  NO_GAME_IN_PROGRESS_ERROR,
} from './GameAreaController';

export type VehicleTrickEvents = GameEventTypes & {
  targetWordChanged: (newWord: string) => void;
  scoreChanged: (newScore: number) => number;
};

export default class VehicleTrickAreaController extends GameAreaController<
  VehicleTrickGameState,
  VehicleTrickEvents
> {
  private _currentWord = '';

  private _currentScore = 0;

  get currentWord(): string {
    return this.currentWord;
  }

  get currentScore(): number {
    return this.currentScore;
  }

  /**
   * Returns true if our player is a player in this game.
   */
  get isPlayer(): boolean {
    return this._model.game?.players.includes(this._townController.ourPlayer.id) || false;
  }

  /**
   * Returns true if the trick game is in progress.
   * @returns True if the trick game is in progress
   */
  public isActive(): boolean {
    return this._model.game?.state.status === 'IN_PROGRESS';
  }

  protected _updateFrom(newModel: GameArea<VehicleTrickGameState>): void {
    super._updateFrom(newModel);
    const newState = newModel.game;
    if (newState) {
      const newScore = newState.state.currentScore;
      const newWord = newState.state.targetWord;
      if (this._currentScore !== newScore) {
        this._currentScore = newScore;
        this.emit('scoreChanged', newScore);
      }
      if (this._currentWord !== newWord) {
        this._currentWord = newWord;
        this.emit('targetWordChanged', newWord);
      }
    }
  }

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
}
