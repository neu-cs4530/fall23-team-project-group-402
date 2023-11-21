import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VehicleTrick from './VehicleTrick';
import VehicleTrickAreaController from '../../../../classes/interactable/VehicleTrickAreaController';
import { mock } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import React from 'react';
import { GameArea, GameStatus, VehicleTrickGameState } from '../../../../types/CoveyTownSocket';
import TownController from '../../../../classes/TownController';
import PlayerController from '../../../../classes/PlayerController';
import { act } from 'react-dom/test-utils';
import { timeStamp } from 'console';

const mockToast = jest.fn();
jest.mock('@chakra-ui/react', () => {
  const ui = jest.requireActual('@chakra-ui/react');
  const mockUseToast = () => mockToast;
  return {
    ...ui,
    useToast: mockUseToast,
  };
});

class MockVehicleTrickAreaController extends VehicleTrickAreaController {
  enterWord = jest.fn();

  gameEnded = jest.fn();

  playTrickAnimation = jest.fn();

  mockIsPlayer = false;

  mockWord = 'cookies';

  mockScore = 100;

  public constructor() {
    super(nanoid(), mock<GameArea<VehicleTrickGameState>>(), mock<TownController>());
  }

  /*
    For ease of testing, we will mock the currentWord property
    to return a copy of the mockBoard property, so that
    we can change the mockBoard property and then check
    that the board property is updated correctly.
    */
  get currentWord(): string {
    return this.mockWord;
  }

  get currentScore(): number {
    return this.mockScore;
  }

  get observers(): PlayerController[] {
    throw new Error('Method should not be called within this component.');
  }

  get moveCount(): number {
    throw new Error('Method should not be called within this component.');
  }

  get winner(): PlayerController | undefined {
    throw new Error('Method should not be called within this component.');
  }

  get whoseTurn(): PlayerController | undefined {
    throw new Error('Method should not be called within this component.');
  }

  get status(): GameStatus {
    throw new Error('Method should not be called within this component.');
  }

  get isPlayer() {
    return this.mockIsPlayer;
  }

  get gamePiece(): 'X' | 'O' {
    throw new Error('Method should not be called within this component.');
  }

  public isActive(): boolean {
    throw new Error('Method should not be called within this component.');
  }

  public mockReset() {
    this.mockWord = 'cookies';
    this.mockScore = 100;
    this.enterWord.mockReset();
    this.gameEnded.mockReset();
    this.playTrickAnimation.mockReset();
  }
}

describe('VehicleTrick', () => {
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

  const gameAreaController = new MockVehicleTrickAreaController();
  beforeEach(() => {
    gameAreaController.mockReset();
  });
  async function checkWordInputField({
    interactable,
    checkWord,
    checkInvalidChar,
  }: {
    interactable?: boolean;
    checkWord?: string;
    checkInvalidChar?: string;
  }) {
    const inputField = screen.getByPlaceholderText('type word here');
    if (interactable) {
      // Should be one interactable field if player is active
      expect(inputField).toBeEnabled();
      gameAreaController.enterWord.mockReset();

      if (checkWord) {
        fireEvent.change(inputField, { target: { value: checkWord } });
        expect(gameAreaController.enterWord).toBeCalledWith(checkWord);
      }
      if (checkInvalidChar) {
        fireEvent.change(inputField, { target: { value: checkInvalidChar } });
        expect(inputField).toHaveValue('');
      }
    } else {
      // There should not be an input field if player is observer
      expect(inputField).toBeUndefined();
    }
  }
  async function checkInitialsInputField({
    interactable,
    checkInitials,
    checkShortInitials,
    checkInvalidInitials,
  }: {
    interactable?: boolean;
    checkInitials?: string;
    checkShortInitials?: string;
    checkInvalidInitials?: string;
  }) {
    const inputField = screen.getByPlaceholderText('initials');
    const submitButton = screen.getByLabelText('submit');
    if (interactable) {
      // Should be one interactable field if player is active
      expect(inputField).toBeEnabled();
      mockToast.mockClear();

      if (checkInitials) {
        fireEvent.change(inputField, { target: { value: checkInitials } });
        expect(inputField).toHaveValue(checkInitials);
        submitButton.click();
        expect(gameAreaController.gameEnded).toBeCalledWith(checkInitials);
      }
      if (checkShortInitials) {
        fireEvent.change(inputField, { target: { value: checkShortInitials } });
        expect(inputField).toHaveValue(checkShortInitials);
        expect(mockToast).not.toBeCalled();
        mockToast.mockClear();
        submitButton.click();
        await waitFor(() => {
          expect(mockToast).toBeCalledWith(
            expect.objectContaining({
              description: 'Username must be 3 characters long',
              status: 'error',
              title: 'Invalid Username',
            }),
          );
        });
      }
      if (checkInvalidInitials) {
        fireEvent.change(inputField, { target: { value: checkInvalidInitials } });
        expect(inputField).toHaveValue('');
      }
    } else {
      // There should not be an input field if player is observer
      expect(inputField).toBeUndefined();
    }
  }
  // describe('[T3.1] When observing the game', () => {
  //   beforeEach(() => {
  //     gameAreaController.mockIsPlayer = false;
  //   });
  //   it('renders the board with the correct number of cells', async () => {
  //     render(<TicTacToeBoard gameAreaController={gameAreaController} />);
  //     const cells = screen.getAllByRole('button');
  //     // There should be exactly 9 buttons: one per-cell (and no other buttons in this component)
  //     expect(cells).toHaveLength(9);
  //     // Each cell should have the correct aria-label
  //     for (let i = 0; i < 9; i++) {
  //       expect(cells[i]).toHaveAttribute('aria-label', `Cell ${Math.floor(i / 3)},${i % 3}`);
  //     }
  //     // Each cell should have the correct text content
  //     expect(cells[0]).toHaveTextContent('X');
  //     expect(cells[1]).toHaveTextContent('O');
  //     expect(cells[2]).toHaveTextContent('');
  //     expect(cells[3]).toHaveTextContent('');
  //     expect(cells[4]).toHaveTextContent('X');
  //     expect(cells[5]).toHaveTextContent('');
  //     expect(cells[6]).toHaveTextContent('');
  //     expect(cells[7]).toHaveTextContent('');
  //     expect(cells[8]).toHaveTextContent('O');
  //   });
  //   it('does not make a move when a cell is clicked, and cell is disabled', async () => {
  //     render(<TicTacToeBoard gameAreaController={gameAreaController} />);
  //     const cells = screen.getAllByRole('button');
  //     for (let i = 0; i < 9; i++) {
  //       expect(cells[i]).toBeDisabled();
  //       fireEvent.click(cells[i]);
  //       expect(gameAreaController.makeMove).not.toHaveBeenCalled();
  //       expect(mockToast).not.toHaveBeenCalled();
  //     }
  //   });
  //   it('updates the board displayed in response to boardChanged events', async () => {
  //     render(<TicTacToeBoard gameAreaController={gameAreaController} />);
  //     gameAreaController.mockBoard = [
  //       ['O', 'X', 'O'],
  //       ['X', 'O', 'X'],
  //       ['O', 'X', 'O'],
  //     ];
  //     act(() => {
  //       gameAreaController.emit('boardChanged', gameAreaController.mockBoard);
  //     });
  //     await checkBoard({});
  //     gameAreaController.mockBoard = [
  //       ['X', 'O', 'X'],
  //       [undefined, undefined, 'X'],
  //       ['O', 'X', undefined],
  //     ];
  //     act(() => {
  //       gameAreaController.emit('boardChanged', gameAreaController.mockBoard);
  //     });
  //     await checkBoard({});
  //   });
  // });
  describe('[T3.2] When playing the game', () => {
    beforeEach(() => {
      gameAreaController.mockIsPlayer = true;
    });
    describe('Gameplay screen', () => {
      it('displays a field when the player starts game', async () => {
        render(<VehicleTrick gameAreaController={gameAreaController} />);
        await checkWordInputField({ interactable: true });
      });
      it('makes a move when word is typed', async () => {
        render(<VehicleTrick gameAreaController={gameAreaController} />);
        await checkWordInputField({ interactable: true, checkWord: 'cook' });
      });
      it('field does not update when invalid word is typed', async () => {
        render(<VehicleTrick gameAreaController={gameAreaController} />);
        await checkWordInputField({ interactable: true, checkInvalidChar: 'cook>' });
      });
      it('updates the targetWord in response to targetWordChanged events', async () => {
        render(<VehicleTrick gameAreaController={gameAreaController} />);
        await checkWordInputField({ interactable: true });
        const targetWord = screen.getByLabelText('target-word');
        expect(targetWord).toHaveTextContent('cookies');
        gameAreaController.mockWord = 'donuts';
        act(() => {
          gameAreaController.emit('targetWordChanged', gameAreaController.mockWord);
        });
        await checkWordInputField({ interactable: true });
        expect(targetWord).toHaveTextContent('donuts');
      });
      it('updates the score in response to scoreChanged events', async () => {
        render(<VehicleTrick gameAreaController={gameAreaController} />);
        await checkWordInputField({ interactable: true });
        const score = screen.getByLabelText('score');
        expect(score).toHaveTextContent('0');
        gameAreaController.mockScore = 100;
        act(() => {
          gameAreaController.emit('scoreChanged', gameAreaController.mockScore);
        });
        await checkWordInputField({ interactable: true });
        expect(score).toHaveTextContent('100');
      });
    });
    describe('Initials screen', () => {
      it('displays initials screen when timer runs out', async () => {
        jest.useFakeTimers();
        render(<VehicleTrick gameAreaController={gameAreaController} />);
        jest.advanceTimersByTime(16000);
        const highScore = screen.getByLabelText('highscore');
        expect(highScore).toHaveTextContent('Your Score: 0');
        checkInitialsInputField({ interactable: true });
      });
      it('input field ignores non-alphabetical characters', async () => {
        jest.useFakeTimers();
        render(<VehicleTrick gameAreaController={gameAreaController} />);
        jest.advanceTimersByTime(16000);
        checkInitialsInputField({ interactable: true, checkInvalidInitials: 'SW^' });
      });
      it('allows user to submit valid initials', async () => {
        jest.useFakeTimers();
        render(<VehicleTrick gameAreaController={gameAreaController} />);
        jest.advanceTimersByTime(16000);
        checkInitialsInputField({ interactable: true, checkInitials: 'SWE' });
      });
      it('does not allow user to submit initials under 3 characters', async () => {
        jest.useFakeTimers();
        render(<VehicleTrick gameAreaController={gameAreaController} />);
        jest.advanceTimersByTime(16000);
        checkInitialsInputField({ interactable: true, checkShortInitials: 'SW' });
      });
    });
  });
});
