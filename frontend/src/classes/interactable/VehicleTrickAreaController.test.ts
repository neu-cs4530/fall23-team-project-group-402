import { nanoid } from 'nanoid';
import PlayerController from '../PlayerController';
import assert from 'assert';
import { mock } from 'jest-mock-extended';
import {
  GameResult,
  GameStatus,
  GameArea,
  VehicleTrickGameState,
} from '../../types/CoveyTownSocket';
import TownController from '../TownController';
import GameAreaController, { NO_GAME_IN_PROGRESS_ERROR } from './GameAreaController';
import VehicleTrickAreaController from './VehicleTrickAreaController';

describe('VehicleTrickAreaController', () => {
  const ourPlayer = new PlayerController(
    nanoid(),
    nanoid(),
    {
      x: 0,
      y: 0,
      moving: false,
      rotation: 'front',
    },
    undefined,
  );
  const otherPlayers = [
    new PlayerController(
      nanoid(),
      nanoid(),
      { x: 0, y: 0, moving: false, rotation: 'front' },
      undefined,
    ),
    new PlayerController(
      nanoid(),
      nanoid(),
      { x: 0, y: 0, moving: false, rotation: 'front' },
      undefined,
    ),
  ];

  const mockTownController = mock<TownController>();
  Object.defineProperty(mockTownController, 'ourPlayer', {
    get: () => ourPlayer,
  });
  Object.defineProperty(mockTownController, 'players', {
    get: () => [ourPlayer, ...otherPlayers],
  });
  mockTownController.getPlayer.mockImplementation(playerID => {
    const p = mockTownController.players.find(player => player.id === playerID);
    assert(p);
    return p;
  });

  function vehicleTrickAreaControllerWithProp({
    _id,
    history,
    playerID,
    undefinedGame,
    status,
  }: {
    _id?: string;
    history?: GameResult[];
    playerID?: string;
    undefinedGame?: boolean;
    status?: GameStatus;
  }) {
    const id = _id || nanoid();
    const players = [];
    if (playerID) players.push(playerID);
    const ret = new VehicleTrickAreaController(
      id,
      {
        id,
        occupants: players,
        history: history || [],
        type: 'VehicleTrickArea',
        game: undefinedGame
          ? undefined
          : {
              id,
              players: players,
              state: {
                status: status || 'IN_PROGRESS',
                player: playerID,
                targetWord: '',
                currentScore: 0,
              },
            },
      },
      mockTownController,
    );
    if (players) {
      ret.occupants = players
        .map(eachID => mockTownController.players.find(eachPlayer => eachPlayer.id === eachID))
        .filter(eachPlayer => eachPlayer) as PlayerController[];
    }
    return ret;
  }
  describe('currentWord', () => {
    it('should return the current target word in the game', () => {
      const controller = vehicleTrickAreaControllerWithProp({});
      expect(controller.currentWord).toEqual('');
    });
  });
  describe('currentScore', () => {
    it('should return the current score in the game', () => {
      const controller = vehicleTrickAreaControllerWithProp({});
      expect(controller.currentScore).toEqual(0);
    });
  });
  describe('isPlayer', () => {
    it('should return true if the current player is a player in this game', () => {
      const controller = vehicleTrickAreaControllerWithProp({
        status: 'IN_PROGRESS',
        playerID: ourPlayer.id,
      });
      expect(controller.isPlayer).toBe(true);
    });
    it('should return false if the current player is not a player in this game', () => {
      const controller = vehicleTrickAreaControllerWithProp({
        status: 'IN_PROGRESS',
        playerID: otherPlayers[0].id,
      });
      expect(controller.isPlayer).toBe(false);
    });
  });
  describe('isActive', () => {
    it('should return true if the game is in progress', () => {
      const controller = vehicleTrickAreaControllerWithProp({
        status: 'IN_PROGRESS',
      });
      expect(controller.isActive()).toBe(true);
    });
    it('should return false if the game is not in progress', () => {
      const controller = vehicleTrickAreaControllerWithProp({
        status: 'OVER',
      });
      expect(controller.isActive()).toBe(false);
    });
  });
  describe('status', () => {
    it('should return the status of the game', () => {
      const controller = vehicleTrickAreaControllerWithProp({
        status: 'IN_PROGRESS',
      });
      expect(controller.status).toBe('IN_PROGRESS');
    });
    it('should return WAITING_TO_START if the game is not defined', () => {
      const controller = vehicleTrickAreaControllerWithProp({
        undefinedGame: true,
      });
      expect(controller.status).toBe('WAITING_TO_START');
    });
  });
  describe('player', () => {
    it('should return the player if there is one', () => {
      const controller = vehicleTrickAreaControllerWithProp({
        status: 'IN_PROGRESS',
        playerID: ourPlayer.id,
      });
      expect(controller.player).toBe(ourPlayer);
    });
    it('should return undefined if there is no player and the game is waiting to start', () => {
      const controller = vehicleTrickAreaControllerWithProp({
        status: 'WAITING_TO_START',
      });
      expect(controller.player).toBe(undefined);
    });
  });
  describe('enterWord', () => {
    it('should throw an error if the game is not in progress', async () => {
      const controller = vehicleTrickAreaControllerWithProp({});
      await expect(async () => controller.enterWord('testing')).rejects.toEqual(
        new Error(NO_GAME_IN_PROGRESS_ERROR),
      );
    });
    it('Should call townController.sendInteractableCommand', async () => {
      const controller = vehicleTrickAreaControllerWithProp({
        status: 'IN_PROGRESS',
        playerID: ourPlayer.id,
      });
      // Simulate joining the game for real
      const instanceID = nanoid();
      mockTownController.sendInteractableCommand.mockImplementationOnce(async () => {
        return { gameID: instanceID };
      });
      await controller.joinGame();
      mockTownController.sendInteractableCommand.mockReset();
      await controller.enterWord('testing');
      expect(mockTownController.sendInteractableCommand).toHaveBeenCalledWith(controller.id, {
        type: 'GameMove',
        gameID: instanceID,
        move: {
          word: 'testing',
        },
      });
    });
  });
  describe('_updateFrom', () => {
    describe('if the game is in progress', () => {
      let controller: VehicleTrickAreaController;
      beforeEach(() => {
        controller = vehicleTrickAreaControllerWithProp({
          status: 'IN_PROGRESS',
          playerID: ourPlayer.id,
        });
      });
      it('should emit a scoreChanged event with the new score', () => {
        const model = controller.toInteractableAreaModel();
        const newScore = 600;
        assert(model.game);
        const newModel: GameArea<VehicleTrickGameState> = {
          ...model,
          game: {
            ...model.game,
            state: {
              ...model.game?.state,
              currentScore: newScore,
            },
          },
        };
        const emitSpy = jest.spyOn(controller, 'emit');
        controller.updateFrom(newModel, otherPlayers.concat(ourPlayer));
        const scoreChangedCall = emitSpy.mock.calls.find(call => call[0] === 'scoreChanged');
        expect(scoreChangedCall).toBeDefined();
        if (scoreChangedCall) expect(scoreChangedCall[1]).toEqual(newScore);
      });
      it('should not emit a scoreChanged event if the score has not changed', () => {
        const model = controller.toInteractableAreaModel();
        assert(model.game);
        const emitSpy = jest.spyOn(controller, 'emit');
        controller.updateFrom(model, otherPlayers.concat(ourPlayer));
        const targetWordChangedCall = emitSpy.mock.calls.find(call => call[0] === 'scoreChanged');
        expect(targetWordChangedCall).not.toBeDefined();
      });
      it('should emit a targetWordChanged event with the new target word', () => {
        const model = controller.toInteractableAreaModel();
        const newWord = 'newWord';
        assert(model.game);
        const newModel: GameArea<VehicleTrickGameState> = {
          ...model,
          game: {
            ...model.game,
            state: {
              ...model.game?.state,
              targetWord: newWord,
            },
          },
        };
        const emitSpy = jest.spyOn(controller, 'emit');
        controller.updateFrom(newModel, otherPlayers.concat(ourPlayer));
        const targetWordChangedCall = emitSpy.mock.calls.find(
          call => call[0] === 'targetWordChanged',
        );
        expect(targetWordChangedCall).toBeDefined();
        if (targetWordChangedCall) expect(targetWordChangedCall[1]).toEqual(newWord);
      });
      it('should not emit a targetWordChanged event if the target word has not changed', () => {
        const model = controller.toInteractableAreaModel();
        assert(model.game);
        const emitSpy = jest.spyOn(controller, 'emit');
        controller.updateFrom(model, otherPlayers.concat(ourPlayer));
        const targetWordChangedCall = emitSpy.mock.calls.find(
          call => call[0] === 'targetWordChanged',
        );
        expect(targetWordChangedCall).not.toBeDefined();
      });
      it('should update the current score returned by the currentScore property', () => {
        const model = controller.toInteractableAreaModel();
        const newScore = 600;
        assert(model.game);
        const newModel: GameArea<VehicleTrickGameState> = {
          ...model,
          game: {
            ...model.game,
            state: {
              ...model.game?.state,
              currentScore: newScore,
            },
          },
        };
        controller.updateFrom(newModel, otherPlayers.concat(ourPlayer));
        expect(controller.currentScore).toEqual(newScore);
      });
      it('should update the current word returned by the currentWord property', () => {
        const model = controller.toInteractableAreaModel();
        const newWord = 'newWord';
        assert(model.game);
        const newModel: GameArea<VehicleTrickGameState> = {
          ...model,
          game: {
            ...model.game,
            state: {
              ...model.game?.state,
              targetWord: newWord,
            },
          },
        };
        controller.updateFrom(newModel, otherPlayers.concat(ourPlayer));
        expect(controller.currentWord).toEqual(newWord);
      });
    });
    it('should call super._updateFrom', () => {
      //eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore - we are testing spying on a private method
      const spy = jest.spyOn(GameAreaController.prototype, '_updateFrom');
      const controller = vehicleTrickAreaControllerWithProp({});
      const model = controller.toInteractableAreaModel();
      controller.updateFrom(model, otherPlayers.concat(ourPlayer));
      expect(spy).toHaveBeenCalled();
    });
  });
});
