import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { mock, mockReset } from 'jest-mock-extended';
import React from 'react';
import { nanoid } from 'nanoid';
import { act } from 'react-dom/test-utils';
import VehicleTrickAreaController from '../../../../classes/interactable/VehicleTrickAreaController';
import PlayerController from '../../../../classes/PlayerController';
import TownController, * as TownControllerHooks from '../../../../classes/TownController';
import TownControllerContext from '../../../../contexts/TownControllerContext';
import {
  GameArea,
  GameResult,
  GameStatus,
  PlayerLocation,
  VehicleTrickGameState,
} from '../../../../types/CoveyTownSocket';
import PhaserGameArea from '../GameArea';
import * as VehicleTrickLeaderboard from './VehicleTrickLeaderboard';
import VehicleTrickAreaWrapper from './VehicleTrickArea';
import * as VehicleTrick from './VehicleTrick';

const mockToast = jest.fn();
jest.mock('@chakra-ui/react', () => {
  const ui = jest.requireActual('@chakra-ui/react');
  const mockUseToast = () => mockToast;
  return {
    ...ui,
    useToast: mockUseToast,
  };
});
const mockGameArea = mock<PhaserGameArea>();
mockGameArea.getData.mockReturnValue('VehicleTrick');
jest.spyOn(TownControllerHooks, 'useInteractable').mockReturnValue(mockGameArea);
const useInteractableAreaControllerSpy = jest.spyOn(
  TownControllerHooks,
  'useInteractableAreaController',
);

const leaderboardComponentSpy = jest.spyOn(VehicleTrickLeaderboard, 'default');
leaderboardComponentSpy.mockReturnValue(<div data-testid='leaderboard' />);

const boardComponentSpy = jest.spyOn(VehicleTrick, 'default');
boardComponentSpy.mockReturnValue(<div data-testid='board' />);

const randomLocation = (): PlayerLocation => ({
  moving: Math.random() < 0.5,
  rotation: 'front',
  x: Math.random() * 1000,
  y: Math.random() * 1000,
});

class MockVehicleTrickAreaController extends VehicleTrickAreaController {
  joinGame = jest.fn();

  mockIsPlayer = false;

  mockObservers: PlayerController[] = [];

  mockStatus: GameStatus = 'WAITING_TO_START';

  mockCurrentGame: GameArea<VehicleTrickGameState> | undefined = undefined;

  mockIsActive = false;

  mockHistory: GameResult[] = [];

  public constructor() {
    super(nanoid(), mock<GameArea<VehicleTrickGameState>>(), mock<TownController>());
  }

  get localHistory(): GameResult[] {
    return this.mockHistory;
  }

  get observers(): PlayerController[] {
    return this.mockObservers;
  }

  get status(): GameStatus {
    return this.mockStatus;
  }

  get isPlayer() {
    return this.mockIsPlayer;
  }

  public isActive(): boolean {
    return this.mockIsActive;
  }
}

describe('[T2] TicTacToeArea', () => {
  // Spy on console.error and intercept react key warnings to fail test
  let consoleErrorSpy: jest.SpyInstance<void, [message?: any, ...optionalParms: any[]]>;
  beforeAll(() => {
    // Spy on console.error and intercept react key warnings to fail test
    consoleErrorSpy = jest.spyOn(global.console, 'error');
    consoleErrorSpy.mockImplementation((message?, ...optionalParams) => {
      const stringMessage = message as string;
      if (stringMessage.includes && stringMessage.includes('children with the same key,')) {
        throw new Error(stringMessage.replace('%s', optionalParams[0]));
      } else if (stringMessage.includes && stringMessage.includes('warning-keys')) {
        throw new Error(stringMessage.replace('%s', optionalParams[0]));
      }
      // eslint-disable-next-line no-console -- we are wrapping the console with a spy to find react warnings
      console.warn(message, ...optionalParams);
    });
  });
  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  let ourPlayer: PlayerController;
  const townController = mock<TownController>();
  Object.defineProperty(townController, 'ourPlayer', { get: () => ourPlayer });
  let gameAreaController = new MockVehicleTrickAreaController();
  let joinGameResolve: () => void;
  let joinGameReject: (err: Error) => void;

  function renderVehicleTrickArea() {
    return render(
      <ChakraProvider>
        <TownControllerContext.Provider value={townController}>
          <VehicleTrickAreaWrapper />
        </TownControllerContext.Provider>
      </ChakraProvider>,
    );
  }
  beforeEach(() => {
    ourPlayer = new PlayerController('player x', 'player x', randomLocation(), undefined);
    mockGameArea.name = nanoid();
    mockReset(townController);
    useInteractableAreaControllerSpy.mockReturnValue(gameAreaController);
    leaderboardComponentSpy.mockClear();
    mockToast.mockClear();
    gameAreaController.joinGame.mockReset();

    gameAreaController.joinGame.mockImplementation(
      () =>
        new Promise<void>((resolve, reject) => {
          joinGameResolve = resolve;
          joinGameReject = reject;
        }),
    );
  });
  describe('Game update listeners', () => {
    it('Registers exactly two listeners when mounted: one for gameUpdated and one for gameEnd', () => {
      const addListenerSpy = jest.spyOn(gameAreaController, 'addListener');
      addListenerSpy.mockClear();

      renderVehicleTrickArea();
      expect(addListenerSpy).toBeCalledTimes(2);
      expect(addListenerSpy).toHaveBeenCalledWith('gameUpdated', expect.any(Function));
      expect(addListenerSpy).toHaveBeenCalledWith('gameEnd', expect.any(Function));
    });
    it('Does not register listeners on every render', () => {
      const removeListenerSpy = jest.spyOn(gameAreaController, 'removeListener');
      const addListenerSpy = jest.spyOn(gameAreaController, 'addListener');
      addListenerSpy.mockClear();
      removeListenerSpy.mockClear();
      const renderData = renderVehicleTrickArea();
      expect(addListenerSpy).toBeCalledTimes(2);
      addListenerSpy.mockClear();

      renderData.rerender(
        <ChakraProvider>
          <TownControllerContext.Provider value={townController}>
            <VehicleTrickAreaWrapper />
          </TownControllerContext.Provider>
        </ChakraProvider>,
      );

      expect(addListenerSpy).not.toBeCalled();
      expect(removeListenerSpy).not.toBeCalled();
    });
    it('Removes the listeners when the component is unmounted', () => {
      const removeListenerSpy = jest.spyOn(gameAreaController, 'removeListener');
      const addListenerSpy = jest.spyOn(gameAreaController, 'addListener');
      addListenerSpy.mockClear();
      removeListenerSpy.mockClear();
      const renderData = renderVehicleTrickArea();
      expect(addListenerSpy).toBeCalledTimes(2);
      const addedListeners = addListenerSpy.mock.calls;
      const addedGameUpdateListener = addedListeners.find(call => call[0] === 'gameUpdated');
      const addedGameEndedListener = addedListeners.find(call => call[0] === 'gameEnd');
      expect(addedGameEndedListener).toBeDefined();
      expect(addedGameUpdateListener).toBeDefined();
      renderData.unmount();
      expect(removeListenerSpy).toBeCalledTimes(2);
      const removedListeners = removeListenerSpy.mock.calls;
      const removedGameUpdateListener = removedListeners.find(call => call[0] === 'gameUpdated');
      const removedGameEndedListener = removedListeners.find(call => call[0] === 'gameEnd');
      expect(removedGameUpdateListener).toEqual(addedGameUpdateListener);
      expect(removedGameEndedListener).toEqual(addedGameEndedListener);
    });
    it('Creates new listeners if the gameAreaController changes', () => {
      const removeListenerSpy = jest.spyOn(gameAreaController, 'removeListener');
      const addListenerSpy = jest.spyOn(gameAreaController, 'addListener');
      addListenerSpy.mockClear();
      removeListenerSpy.mockClear();
      const renderData = renderVehicleTrickArea();
      expect(addListenerSpy).toBeCalledTimes(2);

      gameAreaController = new MockVehicleTrickAreaController();
      const removeListenerSpy2 = jest.spyOn(gameAreaController, 'removeListener');
      const addListenerSpy2 = jest.spyOn(gameAreaController, 'addListener');

      useInteractableAreaControllerSpy.mockReturnValue(gameAreaController);
      renderData.rerender(
        <ChakraProvider>
          <TownControllerContext.Provider value={townController}>
            <VehicleTrickAreaWrapper />
          </TownControllerContext.Provider>
        </ChakraProvider>,
      );
      expect(removeListenerSpy).toBeCalledTimes(2);

      expect(addListenerSpy2).toBeCalledTimes(2);
      expect(removeListenerSpy2).not.toBeCalled();
    });
  });
  describe('Rendering the local leaderboard', () => {
    it('Renders the leaderboard with the history when the component is mounted', () => {
      gameAreaController.mockHistory = [
        {
          gameID: nanoid(),
          scores: { [nanoid()]: 100 },
        },
      ];
      renderVehicleTrickArea();
      expect(leaderboardComponentSpy).toHaveBeenCalledWith(
        {
          results: gameAreaController.mockHistory,
          isPersistent: false,
        },
        {},
      );
    });
    it('Renders the leaderboard with the history when the game is updated', () => {
      gameAreaController.mockHistory = [
        {
          gameID: nanoid(),
          scores: { [nanoid()]: 100 },
        },
      ];
      renderVehicleTrickArea();
      expect(leaderboardComponentSpy).toHaveBeenCalledWith(
        {
          results: gameAreaController.mockHistory,
          isPersistent: false,
        },
        {},
      );

      gameAreaController.mockHistory = [
        {
          gameID: nanoid(),
          scores: { [nanoid()]: 200 },
        },
      ];
      act(() => {
        gameAreaController.emit('gameUpdated');
      });
      expect(leaderboardComponentSpy).toHaveBeenCalledWith(
        {
          results: gameAreaController.mockHistory,
          isPersistent: false,
        },
        {},
      );
    });
  });
  describe('Join game button', () => {
    it('Is not shown if the game is in progress', () => {
      gameAreaController.mockStatus = 'IN_PROGRESS';
      gameAreaController.mockIsPlayer = false;
      renderVehicleTrickArea();
      expect(screen.queryByText('Start Game')).not.toBeInTheDocument();
    });
    it('Is shown when the game is not in progress', () => {
      gameAreaController.mockStatus = 'WAITING_TO_START';
      gameAreaController.mockIsPlayer = false;
      renderVehicleTrickArea();
      expect(screen.queryByText('Start Game')).toBeInTheDocument();
    });
    describe('When clicked', () => {
      it('Calls joinGame on the gameAreaController', () => {
        gameAreaController.mockStatus = 'WAITING_TO_START';
        gameAreaController.mockIsPlayer = false;
        renderVehicleTrickArea();
        const button = screen.getByText('Start Game');
        fireEvent.click(button);
        setTimeout(async () => {
          expect(gameAreaController.joinGame).toBeCalled();
        }, 1000);
      });
      it('Displays a toast with the error message if there is an error joining the game', async () => {
        gameAreaController.mockStatus = 'WAITING_TO_START';
        gameAreaController.mockIsPlayer = false;
        const errorMessage = nanoid();
        renderVehicleTrickArea();
        const button = screen.getByText('Start Game');
        fireEvent.click(button);
        setTimeout(async () => {
          expect(gameAreaController.joinGame).toBeCalled();
          act(() => {
            joinGameReject(new Error(errorMessage));
          });
          await waitFor(() => {
            expect(mockToast).toBeCalledWith(
              expect.objectContaining({
                description: `Error: ${errorMessage}`,
                status: 'error',
              }),
            );
          });
        }, 1000);
      });
      it('Is disabled and set to loading when the player is joining a game', async () => {
        gameAreaController.mockStatus = 'WAITING_TO_START';
        gameAreaController.mockIsPlayer = false;
        renderVehicleTrickArea();
        const button = screen.getByText('Start Game');
        expect(button).toBeEnabled();
        expect(within(button).queryByText('Loading...')).not.toBeInTheDocument(); //Check that the loading text is not displayed
        fireEvent.click(button);
        setTimeout(async () => {
          expect(gameAreaController.joinGame).toBeCalled();
          expect(button).toBeDisabled();
          expect(within(button).queryByText('Loading...')).toBeInTheDocument(); //Check that the loading text is displayed
          act(() => {
            joinGameResolve();
          });
          await waitFor(() => expect(button).toBeEnabled());
          expect(within(button).queryByText('Loading...')).not.toBeInTheDocument(); //Check that the loading text is not displayed
        }, 1000);
      });
    });
    it('Adds the display of the button when a game becomes possible to join', () => {
      gameAreaController.mockStatus = 'IN_PROGRESS';
      gameAreaController.mockIsPlayer = false;
      renderVehicleTrickArea();
      expect(screen.queryByText('Start Game')).not.toBeInTheDocument();
      act(() => {
        gameAreaController.mockStatus = 'OVER';
        gameAreaController.emit('gameUpdated');
      });
      expect(screen.queryByText('Start Game')).toBeInTheDocument();
    });
    it('Removes the display of the button when a game becomes no longer possible to join', () => {
      gameAreaController.mockStatus = 'WAITING_TO_START';
      gameAreaController.mockIsPlayer = false;
      renderVehicleTrickArea();
      expect(screen.queryByText('Start Game')).toBeInTheDocument();
      act(() => {
        gameAreaController.mockStatus = 'IN_PROGRESS';
        gameAreaController.emit('gameUpdated');
      });
      expect(screen.queryByText('Start Game')).not.toBeInTheDocument();
    });
  });
  describe('Rendering the current observers', () => {
    beforeEach(() => {
      gameAreaController.mockObservers = [
        new PlayerController('player 1', 'player 1', randomLocation(), undefined),
        new PlayerController('player 2', 'player 2', randomLocation(), undefined),
        new PlayerController('player 3', 'player 3', randomLocation(), undefined),
      ];
      gameAreaController.mockStatus = 'WAITING_TO_START';
      gameAreaController.mockIsPlayer = false;
    });
    it('Displays the correct observers when the component is mounted', () => {
      renderVehicleTrickArea();
      const observerList = screen.getByLabelText('list of observers in the game');
      const observerItems = observerList.querySelectorAll('li');
      expect(observerItems).toHaveLength(gameAreaController.mockObservers.length);
      for (let i = 0; i < observerItems.length; i++) {
        expect(observerItems[i]).toHaveTextContent(gameAreaController.mockObservers[i].userName);
      }
    });
    it('Displays the correct observers when the game is updated', () => {
      renderVehicleTrickArea();
      act(() => {
        gameAreaController.mockObservers = [
          new PlayerController('player 1', 'player 1', randomLocation(), undefined),
          new PlayerController('player 2', 'player 2', randomLocation(), undefined),
          new PlayerController('player 3', 'player 3', randomLocation(), undefined),
          new PlayerController('player 4', 'player 4', randomLocation(), undefined),
        ];
        gameAreaController.emit('gameUpdated');
      });
      const observerList = screen.getByLabelText('list of observers in the game');
      const observerItems = observerList.querySelectorAll('li');
      expect(observerItems).toHaveLength(gameAreaController.mockObservers.length);
      for (let i = 0; i < observerItems.length; i++) {
        expect(observerItems[i]).toHaveTextContent(gameAreaController.mockObservers[i].userName);
      }
    });
  });
});
