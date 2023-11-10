import InvalidParametersError, {
  GAME_FULL_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE,
} from '../../../lib/InvalidParametersError';
import Player from '../../../lib/Player';
import { GameMove, VehicleTrickGameState, VehicleTrickMove } from '../../../types/CoveyTownSocket';
import Game from '../Game';
import TrickWordGenerator from './TrickWordGenerator';

/**
 * Time in seconds the user has to enter as many words as they can.
 */
const TRICK_TIME_ALLOWED = 15;

/**
 * The number of points the player gets when they enter a correct word.
 */
const CORRECT_WORD_POINTS = 100;

/**
 * The typing game a player can play when they have a vehicle equipped so that
 * they can see themselves do tricks.
 */
export default class VehicleTrickGame extends Game<VehicleTrickGameState, VehicleTrickMove> {
  /**
   * The epoch milliseconds for when a player started the trick game.
   */
  private _gameStartEpoch?: number;

  private _wordGenerator: TrickWordGenerator;

  public constructor() {
    super({
      targetWord: '',
      currentScore: 0,
      status: 'WAITING_TO_START',
    });
    this._wordGenerator = new TrickWordGenerator();
    this._wordGenerator.loadWords();
  }

  public applyMove(move: GameMove<VehicleTrickMove>): void {
    if (this.state.status !== 'IN_PROGRESS') {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    }

    if (move.playerID !== this.state.player) {
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }

    if (!this._moveTimeValid) {
      throw new InvalidParametersError('Time has run out');
    }

    const guess = move.move.word;

    if (guess === this.state.targetWord) {
      const updatedPoints = this.state.currentScore + CORRECT_WORD_POINTS;
      this.state = {
        ...this.state,
        currentScore: updatedPoints,
      };
    }

    this.state = {
      ...this.state,
      targetWord: this._wordGenerator.nextWord(),
    };
  }

  protected _join(player: Player): void {
    if (this.state.player) {
      throw new InvalidParametersError(GAME_FULL_MESSAGE);
    }

    this.state = {
      ...this.state,
      targetWord: this._wordGenerator.nextWord(),
      player: player.id,
      status: 'IN_PROGRESS',
    };

    this._gameStartEpoch = Date.now();
  }

  protected _leave(player: Player): void {
    if (this.state.player !== player.id) {
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }

    this.state = {
      ...this.state,
      status: 'OVER',
    };
  }

  private _moveTimeValid(epochMilliOfMove: number): boolean {
    if (!this._gameStartEpoch) {
      return false;
    }

    if (epochMilliOfMove < this._gameStartEpoch) {
      return false;
    }

    return (epochMilliOfMove - this._gameStartEpoch) / 1000 < TRICK_TIME_ALLOWED;
  }
}
