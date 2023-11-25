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

const trickComponentSpy = jest.spyOn(VehicleTrick, 'default');
trickComponentSpy.mockReturnValue(<div data-testid='trick' />);

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

  mockLocalHistory: GameResult[] = [];

  mockPersistentHistory: GameResult[] = [];

  public constructor() {
    super(nanoid(), mock<GameArea<VehicleTrickGameState>>(), mock<TownController>());
  }

  get status(): GameStatus {
    return this.mockStatus;
  }

  get localHistory(): GameResult[] {
    return this.mockLocalHistory;
  }

  get persistentHistory(): GameResult[] {
    return this.mockPersistentHistory;
  }

  get isPlayer() {
    return this.mockIsPlayer;
  }

  public isActive(): boolean {
    return this.mockIsActive;
  }
}

describe('VehicleTrickArea', () => {
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
    it('Renders the leaderboard button', () => {
      renderVehicleTrickArea();
      expect(screen.getByLabelText('leaderboard')).toBeInTheDocument();
    });
    it('Renders the leaderboard when the button is clicked', () => {
      renderVehicleTrickArea();
      const button = screen.getByLabelText('leaderboard');
      fireEvent.click(button);
      expect(leaderboardComponentSpy).toHaveBeenCalled();
    });
    it('Does not render the leaderboard when the button is clicked if the leaderboard is already displayed', () => {
      renderVehicleTrickArea();
      const button = screen.getByLabelText('leaderboard');
      fireEvent.click(button);
      expect(leaderboardComponentSpy).toHaveBeenCalled();
      fireEvent.click(button);
      expect(leaderboardComponentSpy).toHaveBeenCalledTimes(1);
      expect(button).not.toBeInTheDocument();
    });
    it('Does not render the leaderboard if the start game button is clicked', () => {
      gameAreaController.mockStatus = 'WAITING_TO_START';
      gameAreaController.mockIsPlayer = false;
      renderVehicleTrickArea();
      const startButton = screen.getByText('START GAME');
      fireEvent.click(startButton);
      expect(leaderboardComponentSpy).not.toHaveBeenCalled();
    });
    it('Renders the leaderboard with the history when the component is mounted', () => {
      gameAreaController.mockLocalHistory = [
        {
          gameID: nanoid(),
          scores: { [nanoid()]: 100 },
        },
      ];
      gameAreaController.mockPersistentHistory = [
        {
          gameID: nanoid(),
          scores: { [nanoid()]: 200 },
        },
      ];
      renderVehicleTrickArea();
      const button = screen.getByLabelText('leaderboard');
      fireEvent.click(button);
      expect(leaderboardComponentSpy).toHaveBeenCalledWith(
        {
          localResults: gameAreaController.mockLocalHistory,
          persistentResults: gameAreaController.mockPersistentHistory,
        },
        {},
      );
    });
    it('Renders the leaderboard with the history when the game is updated', () => {
      gameAreaController.mockLocalHistory = [
        {
          gameID: nanoid(),
          scores: { [nanoid()]: 100 },
        },
      ];
      gameAreaController.mockPersistentHistory = [
        {
          gameID: nanoid(),
          scores: { [nanoid()]: 300 },
        },
      ];
      renderVehicleTrickArea();
      const button = screen.getByLabelText('leaderboard');
      fireEvent.click(button);
      expect(leaderboardComponentSpy).toHaveBeenCalledWith(
        {
          localResults: gameAreaController.mockLocalHistory,
          persistentResults: gameAreaController.mockPersistentHistory,
        },
        {},
      );

      gameAreaController.mockLocalHistory = [
        {
          gameID: nanoid(),
          scores: { [nanoid()]: 500 },
        },
      ];
      gameAreaController.mockPersistentHistory = [
        {
          gameID: nanoid(),
          scores: { [nanoid()]: 400 },
        },
      ];
      act(() => {
        gameAreaController.emit('gameUpdated');
      });
      expect(leaderboardComponentSpy).toHaveBeenCalledWith(
        {
          localResults: gameAreaController.mockLocalHistory,
          persistentResults: gameAreaController.mockPersistentHistory,
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
      expect(screen.queryByText('START GAME')).not.toBeInTheDocument();
    });
    it('Is shown when the game is not in progress', () => {
      gameAreaController.mockStatus = 'WAITING_TO_START';
      gameAreaController.mockIsPlayer = false;
      renderVehicleTrickArea();
      expect(screen.queryByText('START GAME')).toBeInTheDocument();
    });
    describe('When clicked', () => {
      it('Calls joinGame on the gameAreaController', () => {
        gameAreaController.mockStatus = 'WAITING_TO_START';
        gameAreaController.mockIsPlayer = false;
        renderVehicleTrickArea();
        const button = screen.getByText('START GAME');
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
        const button = screen.getByText('START GAME');
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
        const button = screen.getByText('START GAME');
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
      expect(screen.queryByText('START GAME')).not.toBeInTheDocument();
      act(() => {
        gameAreaController.mockStatus = 'OVER';
        gameAreaController.emit('gameUpdated');
      });
      expect(screen.queryByText('START GAME')).toBeInTheDocument();
    });
    it('Removes the display of the button when a game becomes no longer possible to join', () => {
      gameAreaController.mockStatus = 'WAITING_TO_START';
      gameAreaController.mockIsPlayer = false;
      renderVehicleTrickArea();
      expect(screen.queryByText('START GAME')).toBeInTheDocument();
      act(() => {
        gameAreaController.mockStatus = 'IN_PROGRESS';
        gameAreaController.emit('gameUpdated');
      });
      expect(screen.queryByText('START GAME')).not.toBeInTheDocument();
    });
  });
});
