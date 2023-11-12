import { mock } from 'jest-mock-extended';
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
} from '../../../types/CoveyTownSocket';
import * as VehicleTrickGameModule from './VehicleTrickGame';
import Player from '../../../lib/Player';
import Game from '../Game';

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
  beforeEach(() => {
    const gameConstructorSpy = jest.spyOn(VehicleTrickGameModule, 'default');
    game = new TestingGame();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore (Testing without using the real game class)
    gameConstructorSpy.mockReturnValue(game);

    player = createPlayerForTesting();
    gameArea = new VehicleTrickGameArea(
      nanoid(),
      { x: 0, y: 0, width: 100, height: 100 },
      mock<TownEmitter>(),
    );
    gameArea.add(player);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore (Test requires access to protected method)
    interactableUpdateSpy = jest.spyOn(gameArea, '_emitAreaChanged');
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
          expect(gameArea.history[0]).toEqual({
            gameID: game.id,
            scores: {
              [player.userName]: 500,
            },
          });
          expect(interactableUpdateSpy).toHaveBeenCalledTimes(1);
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
      });
    });
  });
});