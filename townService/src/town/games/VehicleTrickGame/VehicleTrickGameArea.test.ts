import { mock, mockClear } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import VehicleTrickGameArea from './VehicleTrickGameArea';
import { createPlayerForTesting } from '../../../TestUtils';
import {
  GAME_NOT_IN_PROGRESS_MESSAGE,
  GAME_ID_MISSMATCH_MESSAGE,
  INVALID_COMMAND_MESSAGE,
} from '../../../lib/InvalidParametersError';
import {
  TownEmitter,
  GameInstanceID,
  VehicleTrickGameState,
  VehicleTrickMove,
  VehicleTrickScore,
} from '../../../types/CoveyTownSocket';
import * as VehicleTrickGameModule from './VehicleTrickGame';
import Player from '../../../lib/Player';
import Game from '../Game';
import VehicleTrickService from './VehicleTrickService';

class TestingGame extends Game<VehicleTrickGameState, VehicleTrickMove> {
  public constructor() {
    super({
      targetWord: '',
      currentScore: 0,
      status: 'WAITING_TO_START',
    });
  }

  public applyMove(): void {}

  public endGame() {
    this.state = {
      ...this.state,
      status: 'OVER',
    };
  }

  protected _join(player: Player): void {
    this.state.player = player.id;
    this._players.push(player);
  }

  protected _leave(): void {}

  public setScore(newScore: number) {
    this.state = {
      ...this.state,
      currentScore: newScore,
    };
  }
}

describe('VehicleTrickGameArea', () => {
  let gameArea: VehicleTrickGameArea;
  let player: Player;
  let interactableUpdateSpy: jest.SpyInstance;
  let game: TestingGame;
  let trickService: VehicleTrickService;
  let getTopScoresSpy: jest.SpyInstance;
  let addScoreSpy: jest.SpyInstance;
  const mockScoreData: VehicleTrickScore[] = [
    { initials: 'ABC', score: 400 },
    { initials: 'DEF', score: 300 },
    { initials: 'GHI', score: 200 },
  ];

  beforeEach(done => {
    const gameConstructorSpy = jest.spyOn(VehicleTrickGameModule, 'default');
    game = new TestingGame();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore (Testing without using the real game class)
    gameConstructorSpy.mockReturnValue(game);

    player = createPlayerForTesting();

    trickService = new VehicleTrickService();

    getTopScoresSpy = jest.spyOn(trickService, 'getTopScores');
    getTopScoresSpy.mockResolvedValue(mockScoreData);

    addScoreSpy = jest.spyOn(trickService, 'addScore');
    addScoreSpy.mockResolvedValue(mockScoreData);

    gameArea = new VehicleTrickGameArea(
      nanoid(),
      { x: 0, y: 0, width: 100, height: 100 },
      mock<TownEmitter>(),
      trickService,
    );

    gameArea.add(player);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore (Test requires access to protected method)
    interactableUpdateSpy = jest.spyOn(gameArea, '_emitAreaChanged');

    // Set a small timeout to ensure the gameArea contructor finished
    setTimeout(() => {
      // Tests the constructor
      expect(getTopScoresSpy).toHaveBeenCalledTimes(1);
      expect(interactableUpdateSpy).toHaveBeenCalledTimes(1);
      expect(addScoreSpy).not.toHaveBeenCalled();

      mockClear(getTopScoresSpy);
      mockClear(addScoreSpy);
      mockClear(interactableUpdateSpy);
      done();
    }, 100);
  });

  describe('handleCommand', () => {
    describe('when given a JoinGame command', () => {
      describe('when there is no game in progress', () => {
        it('should create a new game and call _emitAreaChanged', () => {
          const { gameID } = gameArea.handleCommand({ type: 'JoinGame' }, player);
          expect(gameID).toBeDefined();
          if (!game) {
            throw new Error('Game was not created by the first call to join');
          }
          expect(gameID).toEqual(game.id);
          expect(interactableUpdateSpy).toHaveBeenCalledTimes(1);
          expect(addScoreSpy).not.toHaveBeenCalled();
        });
      });
      describe('when there is a game in progress', () => {
        it('should not call _emitAreaChanged if the game throws an error', () => {
          gameArea.handleCommand({ type: 'JoinGame' }, player);
          if (!game) {
            throw new Error('Game was not created by the first call to join');
          }
          interactableUpdateSpy.mockClear();

          const joinSpy = jest.spyOn(game, 'join').mockImplementationOnce(() => {
            throw new Error('Test Error');
          });
          expect(() => gameArea.handleCommand({ type: 'JoinGame' }, player)).toThrowError(
            'Test Error',
          );
          expect(joinSpy).toHaveBeenCalledWith(player);
          expect(interactableUpdateSpy).not.toHaveBeenCalled();
          expect(addScoreSpy).not.toHaveBeenCalled();
        });
      });
    });
    describe('when given a GameMove command', () => {
      it('should throw an error when there is no game in progress', () => {
        expect(() =>
          gameArea.handleCommand(
            { type: 'GameMove', move: { word: 'testing' }, gameID: nanoid() },
            player,
          ),
        ).toThrowError(GAME_NOT_IN_PROGRESS_MESSAGE);
      });
      describe('when there is a game in progress', () => {
        let gameID: GameInstanceID;
        beforeEach(() => {
          gameID = gameArea.handleCommand({ type: 'JoinGame' }, player).gameID;
          interactableUpdateSpy.mockClear();
        });
        it('should throw an error when the game ID does not match', () => {
          expect(() =>
            gameArea.handleCommand(
              { type: 'GameMove', move: { word: 'testing' }, gameID: nanoid() },
              player,
            ),
          ).toThrowError(GAME_ID_MISSMATCH_MESSAGE);
        });
        it('should dispatch the move to the game and call _emitAreaChanged', () => {
          const move: VehicleTrickMove = { word: 'testing' };
          const applyMoveSpy = jest.spyOn(game, 'applyMove');
          gameArea.handleCommand({ type: 'GameMove', move, gameID }, player);
          expect(applyMoveSpy).toHaveBeenCalledWith({
            gameID: game.id,
            playerID: player.id,
            move: {
              ...move,
            },
          });
          expect(interactableUpdateSpy).toHaveBeenCalledTimes(1);
          expect(addScoreSpy).not.toHaveBeenCalled();
        });
        it('should not call _emitAreaChanged if the game throws an error', () => {
          const move: VehicleTrickMove = { word: 'testing' };
          const applyMoveSpy = jest.spyOn(game, 'applyMove').mockImplementationOnce(() => {
            throw new Error('Test Error');
          });
          expect(() =>
            gameArea.handleCommand({ type: 'GameMove', move, gameID }, player),
          ).toThrowError('Test Error');
          expect(applyMoveSpy).toHaveBeenCalledWith({
            gameID: game.id,
            playerID: player.id,
            move: {
              ...move,
            },
          });
          expect(interactableUpdateSpy).not.toHaveBeenCalled();
          expect(addScoreSpy).not.toHaveBeenCalled();
        });
        test('when the game is over, it records a new row in the history and calls _emitAreaChanged', () => {
          const move: VehicleTrickMove = { word: 'testing' };
          jest.spyOn(game, 'applyMove').mockImplementationOnce(() => {
            game.endGame();
          });
          game.setScore(500);
          gameArea.handleCommand({ type: 'GameMove', move, gameID }, player);

          expect(game.state.status).toEqual('OVER');
          expect(game.state.currentScore).toEqual(500);
          expect(gameArea.history.length).toEqual(1);
          expect(addScoreSpy).not.toHaveBeenCalled();
          expect(gameArea.history[0]).toEqual({
            gameID: game.id,
            scores: {
              [player.userName]: 500,
            },
          });
          expect(interactableUpdateSpy).toHaveBeenCalledTimes(1);
          expect(addScoreSpy).not.toHaveBeenCalled();
        });
      });
    });
    describe('when given a LeaveGame command', () => {
      describe('when there is no game in progress', () => {
        it('should throw an error', () => {
          expect(() =>
            gameArea.handleCommand({ type: 'LeaveGame', gameID: nanoid() }, player),
          ).toThrowError(GAME_NOT_IN_PROGRESS_MESSAGE);
          expect(interactableUpdateSpy).not.toHaveBeenCalled();
          expect(addScoreSpy).not.toHaveBeenCalled();
        });
      });
      describe('when there is a game in progress', () => {
        it('should throw an error when the game ID does not match', () => {
          gameArea.handleCommand({ type: 'JoinGame' }, player);
          interactableUpdateSpy.mockClear();
          expect(() =>
            gameArea.handleCommand({ type: 'LeaveGame', gameID: nanoid() }, player),
          ).toThrowError(GAME_ID_MISSMATCH_MESSAGE);
          expect(interactableUpdateSpy).not.toHaveBeenCalled();
          expect(addScoreSpy).not.toHaveBeenCalled();
        });
        it('should dispatch the leave command to the game and call _emitAreaChanged', () => {
          const { gameID } = gameArea.handleCommand({ type: 'JoinGame' }, player);
          if (!game) {
            throw new Error('Game was not created by the first call to join');
          }
          expect(interactableUpdateSpy).toHaveBeenCalledTimes(1);
          const leaveSpy = jest.spyOn(game, 'leave');
          gameArea.handleCommand({ type: 'LeaveGame', gameID }, player);
          expect(leaveSpy).toHaveBeenCalledWith(player);
          expect(interactableUpdateSpy).toHaveBeenCalledTimes(2);
          expect(addScoreSpy).not.toHaveBeenCalled();
        });
        it('should not call _emitAreaChanged if the game throws an error', () => {
          gameArea.handleCommand({ type: 'JoinGame' }, player);
          if (!game) {
            throw new Error('Game was not created by the first call to join');
          }
          interactableUpdateSpy.mockClear();
          const leaveSpy = jest.spyOn(game, 'leave').mockImplementationOnce(() => {
            throw new Error('Test Error');
          });
          expect(() =>
            gameArea.handleCommand({ type: 'LeaveGame', gameID: game.id }, player),
          ).toThrowError('Test Error');
          expect(leaveSpy).toHaveBeenCalledWith(player);
          expect(interactableUpdateSpy).not.toHaveBeenCalled();
          expect(addScoreSpy).not.toHaveBeenCalled();
        });
        it('should update the history if the game is over', () => {
          const { gameID } = gameArea.handleCommand({ type: 'JoinGame' }, player);
          interactableUpdateSpy.mockClear();
          jest.spyOn(game, 'leave').mockImplementationOnce(() => {
            game.endGame();
          });
          game.setScore(200);
          gameArea.handleCommand({ type: 'LeaveGame', gameID }, player);
          expect(game.state.status).toEqual('OVER');
          expect(gameArea.history.length).toEqual(1);
          expect(gameArea.history[0]).toEqual({
            gameID: game.id,
            scores: {
              [player.userName]: 200,
            },
          });
          expect(interactableUpdateSpy).toHaveBeenCalledTimes(1);
          expect(addScoreSpy).not.toHaveBeenCalled();
        });
      });
    });
    describe('when given a GameEnded command', () => {
      it('should throw an error if a game is not in progress', () => {
        expect(() => {
          gameArea.handleCommand({ type: 'GameEnded', playerInitials: 'ABC' }, player);
        }).toThrowError(GAME_NOT_IN_PROGRESS_MESSAGE);
      });
      it('should add to the local history and call addScore', () => {
        gameArea.handleCommand({ type: 'JoinGame' }, player);
        interactableUpdateSpy.mockClear();
        jest.spyOn(game, 'leave').mockImplementationOnce(() => {
          game.endGame();
        });
        game.setScore(200);

        expect(gameArea.history.length).toEqual(0);
        expect(interactableUpdateSpy).not.toHaveBeenCalled();
        expect(addScoreSpy).not.toHaveBeenCalled();

        gameArea.handleCommand({ type: 'GameEnded', playerInitials: 'ABC' }, player);

        expect(game.state.status).toEqual('OVER');
        expect(gameArea.history.length).toEqual(1);
        expect(interactableUpdateSpy).toHaveBeenCalled();
        expect(addScoreSpy).toHaveBeenCalled();
        expect(gameArea.history[0]).toEqual({
          gameID: game.id,
          scores: {
            ABC: 200,
          },
        });
      });
    });
    describe('when given an invalid command', () => {
      it('should throw an error', () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore (Testing an invalid command, only possible at the boundary of the type system)
        expect(() => gameArea.handleCommand({ type: 'InvalidCommand' }, player)).toThrowError(
          INVALID_COMMAND_MESSAGE,
        );
        expect(interactableUpdateSpy).not.toHaveBeenCalled();
        expect(addScoreSpy).not.toHaveBeenCalled();
      });
    });
  });
});
