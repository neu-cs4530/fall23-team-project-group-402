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
  const observerText = 'Please wait, someone else is currently playing!';
  beforeEach(() => {
    gameAreaController.mockReset();
    mockToast.mockReset();
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
    if (interactable) {
      const inputField = screen.getByPlaceholderText('type word here');
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
      const inputField = screen.queryByPlaceholderText('type word here');
      expect(inputField).toBeNull();
      const observerTextComponent = screen.getByLabelText('observer-text');
      expect(observerTextComponent).toHaveTextContent(observerText);
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
    if (interactable) {
      const inputField = screen.getByPlaceholderText('initials');
      const submitButton = screen.getByLabelText('submit');
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
      const inputField = screen.queryByPlaceholderText('initials');
      const submitButton = screen.queryByLabelText('submit');
      expect(inputField).toBeNull();
      expect(submitButton).toBeNull();
      const observerTextComponent = screen.getByLabelText('observer-text');
      expect(observerTextComponent).toHaveTextContent(observerText);
    }
  }
  describe('[T3.1] When observing the game', () => {
    beforeEach(() => {
      gameAreaController.mockIsPlayer = false;
    });
    it('displays a timer, score and current word when the player starts game', async () => {
      render(<VehicleTrick gameAreaController={gameAreaController} />);
      const timer = screen.getByLabelText('timer');
      expect(timer).toHaveTextContent('15');
      const currentWord = screen.getByLabelText('target-word');
      expect(currentWord).toHaveTextContent('cookies');
      const currentScore = screen.getByLabelText('score');
      expect(currentScore).toHaveTextContent('0');
      await checkWordInputField({ interactable: false });
    });
    it('displays observer message in place of initials screen when timer runs out', async () => {
      jest.useFakeTimers();
      render(<VehicleTrick gameAreaController={gameAreaController} />);
      jest.advanceTimersByTime(16000);
      await checkInitialsInputField({ interactable: false });
    });
    it('increments the timer', async () => {
      jest.useFakeTimers();
      render(<VehicleTrick gameAreaController={gameAreaController} />);
      const timer = screen.getByLabelText('timer');
      expect(timer).toHaveTextContent('15');
      jest.advanceTimersByTime(5000);
      expect(timer).toHaveTextContent('10');
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
  describe('[T3.2] When playing the game', () => {
    beforeEach(() => {
      gameAreaController.mockIsPlayer = true;
    });
    describe('Gameplay screen', () => {
      it('displays an input field, timer, score and current word when the player starts game', async () => {
        render(<VehicleTrick gameAreaController={gameAreaController} />);
        const timer = screen.getByLabelText('timer');
        expect(timer).toHaveTextContent('15');
        const currentWord = screen.getByLabelText('target-word');
        expect(currentWord).toHaveTextContent('cookies');
        const currentScore = screen.getByLabelText('score');
        expect(currentScore).toHaveTextContent('0');
        await checkWordInputField({ interactable: true });
      });
      it('increments the timer', async () => {
        jest.useFakeTimers();
        render(<VehicleTrick gameAreaController={gameAreaController} />);
        const timer = screen.getByLabelText('timer');
        expect(timer).toHaveTextContent('15');
        jest.advanceTimersByTime(5000);
        expect(timer).toHaveTextContent('10');
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
