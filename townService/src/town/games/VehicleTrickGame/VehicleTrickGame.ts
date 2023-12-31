import InvalidParametersError, {
  GAME_FULL_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE,
  TIME_EXPIRED_MESSAGE,
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
 * The typing game a user can play when they have a vehicle equipped so that
 * they can see themselves do tricks.
 */
export default class VehicleTrickGame extends Game<VehicleTrickGameState, VehicleTrickMove> {
  /**
   * The epoch milliseconds for when a player started the trick game.
   */
  private _gameStartEpoch?: number;

  private _wordGenerator: TrickWordGenerator;

  private _timerIntervalId?: NodeJS.Timeout;

  private _usedWords: Array<string> = [];

  public constructor(wordGenerator: TrickWordGenerator | undefined = undefined) {
    super({
      targetWord: '',
      currentScore: 0,
      status: 'WAITING_TO_START',
      timeLeft: TRICK_TIME_ALLOWED,
    });
    this._wordGenerator = wordGenerator ?? new TrickWordGenerator();
  }

  /**
   * Iterates the internal clock for the vehicle trick game if we can.
   */
  public iterateClock(): void {
    const newTimeLeft = this.state.timeLeft - 1;
    if (newTimeLeft >= 0) {
      this.state = {
        ...this.state,
        timeLeft: newTimeLeft,
      };
    }
  }

  /**
   * Gets a new word and ensures that it is not repeated.
   */
  private _getNextWord(): string {
    let nextWord = this._wordGenerator.nextWord();
    while (this._usedWords.includes(nextWord)) {
      nextWord = this._wordGenerator.nextWord();
    }
    this._usedWords.push(nextWord);
    return nextWord;
  }

  /**
   * Applies a player's move to the game. If the guessed word is the target word,
   * we update the player's score and generate a new word.
   * A move is invalid if:
   *  - The game is not in progress
   *  - The move is made by a player not in the game
   * @param move The move to apply to the game
   * @throws InvalidParametersError if the move is invalid
   */
  public applyMove(move: GameMove<VehicleTrickMove>): void {
    if (this.state.status !== 'IN_PROGRESS') {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    }

    if (move.playerID !== this.state.player) {
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }

    if (!this._moveTimeValid(Date.now())) {
      throw new InvalidParametersError(TIME_EXPIRED_MESSAGE);
    }

    const guess = move.move.word;

    if (guess === this.state.targetWord) {
      const updatedPoints = this.state.currentScore + CORRECT_WORD_POINTS;
      this.state = {
        ...this.state,
        targetWord: this._getNextWord(),
        currentScore: updatedPoints,
      };
    }
  }

  /**
   * Adds a player to the game.
   * @param player The player to join the game
   * @throws InvalidParametersError if the game is full
   */
  protected _join(player: Player): void {
    if (this.state.player) {
      throw new InvalidParametersError(GAME_FULL_MESSAGE);
    }

    this.state = {
      ...this.state,
      targetWord: this._getNextWord(),
      player: player.id,
      status: 'IN_PROGRESS',
    };

    this._gameStartEpoch = Date.now();

    // Sets up a callback to check every 0.5 seconds if the timer has run out
    // so that we can end the game
    this._timerIntervalId = setInterval(() => {
      this._endGameIfTimeElapsed();
    }, 500);
  }

  /**
   * Removes a player from the game.
   * @param player The player to remove
   * @throws InvalidParametersError if the player is not in the game
   */
  protected _leave(player: Player): void {
    if (this.state.player !== player.id) {
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }

    this._endGame();
  }

  /**
   * Ends the current game if time has expired.
   */
  private _endGameIfTimeElapsed() {
    if (!this._moveTimeValid(Date.now())) {
      this._endGame();
    }
  }

  /**
   * Determines if a move was made within the allowed time.
   * @param epochMilliOfMove The epoch time in milliseconds when the move was made.
   * @returns True if the move occurred at a valid time, false otherwise
   */
  private _moveTimeValid(epochMilliOfMove: number): boolean {
    if (!this._gameStartEpoch) {
      return false;
    }

    if (epochMilliOfMove < this._gameStartEpoch) {
      return false;
    }

    return (epochMilliOfMove - this._gameStartEpoch) / 1000 < TRICK_TIME_ALLOWED;
  }

  /**
   * Ends the current game.
   */
  private _endGame(): void {
    this.state = {
      ...this.state,
      status: 'OVER',
    };

    clearInterval(this._timerIntervalId);
  }
}
