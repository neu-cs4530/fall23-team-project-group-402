import { mockClear } from 'jest-mock-extended';
import TrickWordGenerator from './TrickWordGenerator';
import VehicleTrickGame from './VehicleTrickGame';
import { GameMove, GameStatus, VehicleTrickMove } from '../../../types/CoveyTownSocket';
import { createPlayerForTesting } from '../../../TestUtils';
import InvalidParametersError, {
  GAME_FULL_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE,
  TIME_EXPIRED_MESSAGE,
} from '../../../lib/InvalidParametersError';

describe('VehicleTrickGame', () => {
  let game: VehicleTrickGame;
  let wordGenerator: TrickWordGenerator;
  let nextWordSpy: jest.SpyInstance;
  let setIntervalSpy: jest.SpyInstance;
  let clearIntervalSpy: jest.SpyInstance;

  beforeEach(() => {
    wordGenerator = new TrickWordGenerator();
    nextWordSpy = jest.spyOn(wordGenerator, 'nextWord');
    setIntervalSpy = jest.spyOn(global, 'setInterval');
    clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    nextWordSpy.mockReturnValue('testing');
    setIntervalSpy.mockImplementation(() => {});
    clearIntervalSpy.mockImplementation(() => {});

    game = new VehicleTrickGame(wordGenerator);

    mockClear(nextWordSpy);
    mockClear(setIntervalSpy);
    mockClear(clearIntervalSpy);
  });

  function testGameState(
    status: GameStatus,
    playerID: string | undefined,
    targetWord: string,
    currentScore: number,
  ) {
    expect(game.state.status).toEqual(status);
    expect(game.state.player).toEqual(playerID);
    expect(game.state.targetWord).toEqual(targetWord);
    expect(game.state.currentScore).toEqual(currentScore);
  }

  describe('applyMove', () => {
    describe('invalid moves', () => {
      it('throws an error if the game is not in progress', () => {
        const player = createPlayerForTesting();
        const move: GameMove<VehicleTrickMove> = {
          gameID: game.id,
          playerID: player.id,
          move: {
            word: 'apple',
          },
        };

        testGameState('WAITING_TO_START', undefined, '', 0);
        expect(() => game.applyMove(move)).toThrow(
          new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE),
        );
        testGameState('WAITING_TO_START', undefined, '', 0);
      });
      it('throws an error if a move is made by a player not in the game', () => {
        const player1 = createPlayerForTesting();
        const player2 = createPlayerForTesting();
        const move: GameMove<VehicleTrickMove> = {
          gameID: game.id,
          playerID: player2.id,
          move: {
            word: 'apple',
          },
        };
        game.join(player1);

        testGameState('IN_PROGRESS', player1.id, 'testing', 0);
        expect(() => game.applyMove(move)).toThrow(
          new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE),
        );
        testGameState('IN_PROGRESS', player1.id, 'testing', 0);
      });
      it('throws an error if the move is not made in a valid time', () => {
        const dateSpy = jest.spyOn(Date, 'now');
        dateSpy.mockReturnValueOnce(0);
        const player = createPlayerForTesting();
        const move: GameMove<VehicleTrickMove> = {
          gameID: game.id,
          playerID: player.id,
          move: {
            word: 'apple',
          },
        };
        game.join(player);

        testGameState('IN_PROGRESS', player.id, 'testing', 0);
        expect(() => game.applyMove(move)).toThrow(
          new InvalidParametersError(TIME_EXPIRED_MESSAGE),
        );
        testGameState('IN_PROGRESS', player.id, 'testing', 0);

        dateSpy.mockClear();
      });
    });
    describe('valid moves', () => {
      it('does not update the state if word is incorrect', () => {
        const player = createPlayerForTesting();
        const move: GameMove<VehicleTrickMove> = {
          gameID: game.id,
          playerID: player.id,
          move: {
            word: 'apple',
          },
        };
        game.join(player);

        testGameState('IN_PROGRESS', player.id, 'testing', 0);
        game.applyMove(move);
        testGameState('IN_PROGRESS', player.id, 'testing', 0);
      });
      it('does update the state if the word is correct', () => {
        const player = createPlayerForTesting();
        const move: GameMove<VehicleTrickMove> = {
          gameID: game.id,
          playerID: player.id,
          move: {
            word: 'testing',
          },
        };
        game.join(player);
        nextWordSpy.mockReturnValue('testing2');

        testGameState('IN_PROGRESS', player.id, 'testing', 0);
        game.applyMove(move);
        testGameState('IN_PROGRESS', player.id, 'testing2', 100);
      });
    });
  });
  describe('join', () => {
    it('throws an error if there is already a player in the game', () => {
      const player1 = createPlayerForTesting();
      const player2 = createPlayerForTesting();

      testGameState('WAITING_TO_START', undefined, '', 0);
      game.join(player1);
      testGameState('IN_PROGRESS', player1.id, 'testing', 0);
      expect(setIntervalSpy).toHaveBeenCalled();
      mockClear(setIntervalSpy);

      expect(() => {
        game.join(player2);
      }).toThrowError(new InvalidParametersError(GAME_FULL_MESSAGE));
      testGameState('IN_PROGRESS', player1.id, 'testing', 0);
      expect(setIntervalSpy).not.toHaveBeenCalled();
    });
    it('adds the player to the game and calls setInterval', () => {
      const player = createPlayerForTesting();

      testGameState('WAITING_TO_START', undefined, '', 0);
      expect(setIntervalSpy).not.toHaveBeenCalled();
      game.join(player);
      testGameState('IN_PROGRESS', player.id, 'testing', 0);
      expect(setIntervalSpy).toHaveBeenCalled();
    });
  });
  describe('leave', () => {
    describe('when the player leaving is not in the game', () => {
      test('when there are no players in the game', () => {
        const player = createPlayerForTesting();

        testGameState('WAITING_TO_START', undefined, '', 0);
        expect(() => {
          game.leave(player);
        }).toThrowError(new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE));
        testGameState('WAITING_TO_START', undefined, '', 0);
        expect(clearIntervalSpy).not.toHaveBeenCalled();
      });
      test('when there is a player in the game', () => {
        const player1 = createPlayerForTesting();
        const player2 = createPlayerForTesting();
        game.join(player1);

        testGameState('IN_PROGRESS', player1.id, 'testing', 0);
        expect(() => {
          game.leave(player2);
        }).toThrowError(new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE));
        testGameState('IN_PROGRESS', player1.id, 'testing', 0);
        expect(clearIntervalSpy).not.toHaveBeenCalled();
      });
    });
    describe('when the player leaving is in the game', () => {
      it('ends the game and sets the status to over', () => {
        const player = createPlayerForTesting();
        const move: GameMove<VehicleTrickMove> = {
          gameID: game.id,
          playerID: player.id,
          move: {
            word: 'testing',
          },
        };
        game.join(player);
        nextWordSpy.mockReturnValue('testing2');

        testGameState('IN_PROGRESS', player.id, 'testing', 0);
        game.applyMove(move);
        testGameState('IN_PROGRESS', player.id, 'testing2', 100);
        game.leave(player);
        testGameState('OVER', player.id, 'testing2', 100);
        expect(clearIntervalSpy).toHaveBeenCalled();
      });
    });
  });
});
