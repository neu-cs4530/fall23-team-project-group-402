import { render, screen, fireEvent } from '@testing-library/react';
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

  mockTimeLeft = 15;

  public constructor() {
    super(nanoid(), mock<GameArea<VehicleTrickGameState>>(), mock<TownController>());
  }

  get currentWord(): string {
    return this.mockWord;
  }

  get currentScore(): number {
    return this.mockScore;
  }

  get currentTimeLeft(): number {
    return this.mockTimeLeft;
  }

  get observers(): PlayerController[] {
    throw new Error('Method should not be called within this component.');
  }

  get status(): GameStatus {
    throw new Error('Method should not be called within this component.');
  }

  get isPlayer() {
    return this.mockIsPlayer;
  }

  public isActive(): boolean {
    throw new Error('Method should not be called within this component.');
  }

  protected _updateFrom(): void {}

  public updateTimer(newTime: number) {
    this.mockTimeLeft = newTime;
    this.emit('timeLeftChanged', newTime);
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
        expect(mockToast).toBeCalledWith(
          expect.objectContaining({
            description: 'Username must be 3 characters long',
            status: 'error',
            title: 'Invalid Initials',
          }),
        );
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
  async function checkForGameComponents() {
    const timer = screen.getByLabelText('timer');
    expect(timer).toHaveTextContent('15');
    const currentWord = screen.getByLabelText('target-word');
    expect(currentWord).toHaveTextContent('cookies');
    const currentScore = screen.getByLabelText('score');
    expect(currentScore).toHaveTextContent('0');
  }
  async function checkForIncrementingTimer() {
    const timer = screen.getByLabelText('timer');
    expect(timer).toHaveTextContent('15');
    act(() => {
      gameAreaController.updateTimer(10);
    });
    expect(timer).toHaveTextContent('10');
  }
  async function checkTargetWordUpdate(interactable: boolean) {
    const targetWord = screen.getByLabelText('target-word');
    expect(targetWord).toHaveTextContent('cookies');
    gameAreaController.mockWord = 'donuts';
    act(() => {
      gameAreaController.emit('targetWordChanged', gameAreaController.mockWord);
    });
    await checkWordInputField({ interactable });
    expect(targetWord).toHaveTextContent('donuts');
  }
  async function checkScoreUpdate(interactable: boolean) {
    const score = screen.getByLabelText('score');
    expect(score).toHaveTextContent('0');
    gameAreaController.mockScore = 100;
    act(() => {
      gameAreaController.emit('scoreChanged', gameAreaController.mockScore);
    });
    await checkWordInputField({ interactable });
    expect(score).toHaveTextContent('100');
  }
  describe('listeners', () => {
    it('properly registers for listeners when the component is mounted', () => {
      const addListenerSpy = jest.spyOn(gameAreaController, 'addListener');
      addListenerSpy.mockClear();

      render(<VehicleTrick gameAreaController={gameAreaController} />);
      expect(addListenerSpy).toBeCalledTimes(4);
      expect(addListenerSpy).toHaveBeenCalledWith('scoreChanged', expect.any(Function));
      expect(addListenerSpy).toHaveBeenCalledWith('targetWordChanged', expect.any(Function));
      expect(addListenerSpy).toHaveBeenCalledWith('timeLeftChanged', expect.any(Function));
      expect(addListenerSpy).toHaveBeenCalledWith('gameUpdated', expect.any(Function));
    });
    it('does not register listeners on every render', () => {
      const removeListenerSpy = jest.spyOn(gameAreaController, 'removeListener');
      const addListenerSpy = jest.spyOn(gameAreaController, 'addListener');
      addListenerSpy.mockClear();
      removeListenerSpy.mockClear();
      const renderData = render(<VehicleTrick gameAreaController={gameAreaController} />);
      expect(addListenerSpy).toBeCalledTimes(4);
      addListenerSpy.mockClear();

      renderData.rerender(<VehicleTrick gameAreaController={gameAreaController} />);

      expect(addListenerSpy).not.toBeCalled();
      expect(removeListenerSpy).not.toBeCalled();
    });
    it('removes the listeners when the component is unmounted', () => {
      const removeListenerSpy = jest.spyOn(gameAreaController, 'removeListener');
      const addListenerSpy = jest.spyOn(gameAreaController, 'addListener');
      addListenerSpy.mockClear();
      removeListenerSpy.mockClear();
      const renderData = render(<VehicleTrick gameAreaController={gameAreaController} />);
      expect(addListenerSpy).toBeCalledTimes(4);

      const addedListeners = addListenerSpy.mock.calls;
      const scoreChangedListener = addedListeners.find(call => call[0] === 'scoreChanged');
      const targetWordChangedListener = addedListeners.find(
        call => call[0] === 'targetWordChanged',
      );
      const timeLeftChangedListener = addedListeners.find(call => call[0] === 'timeLeftChanged');
      const gameUpdatedListener = addedListeners.find(call => call[0] === 'gameUpdated');

      expect(scoreChangedListener).toBeDefined();
      expect(targetWordChangedListener).toBeDefined();
      expect(timeLeftChangedListener).toBeDefined();
      expect(gameUpdatedListener).toBeDefined();

      renderData.unmount();

      expect(removeListenerSpy).toBeCalledTimes(4);

      const removedListeners = removeListenerSpy.mock.calls;
      const removedScoreChangedListener = removedListeners.find(call => call[0] === 'scoreChanged');
      const removedTargetWordChangedListener = removedListeners.find(
        call => call[0] === 'targetWordChanged',
      );
      const removedTimeLeftChangedListener = removedListeners.find(
        call => call[0] === 'timeLeftChanged',
      );
      const removedGameUpdatedListener = removedListeners.find(call => call[0] === 'gameUpdated');

      expect(removedScoreChangedListener).toEqual(scoreChangedListener);
      expect(removedTargetWordChangedListener).toEqual(targetWordChangedListener);
      expect(removedTimeLeftChangedListener).toEqual(timeLeftChangedListener);
      expect(removedGameUpdatedListener).toEqual(gameUpdatedListener);
    });
  });
  describe('When observing the game', () => {
    beforeEach(() => {
      gameAreaController.mockIsPlayer = false;
      gameAreaController.updateTimer(15);
      render(<VehicleTrick gameAreaController={gameAreaController} />);
    });
    it('displays a timer, score and current word when the player starts game', async () => {
      checkForGameComponents();
      await checkWordInputField({ interactable: false });
    });
    it('displays observer message in place of initials screen when timer runs out', async () => {
      act(() => {
        gameAreaController.updateTimer(0);
      });
      await checkInitialsInputField({ interactable: false });
    });
    it('the timer is updated when the controller changes it', async () => {
      await checkWordInputField({ interactable: false });
      checkForIncrementingTimer();
    });
    it('updates the targetWord in response to targetWordChanged events', async () => {
      await checkWordInputField({ interactable: false });
      checkTargetWordUpdate(false);
    });
    it('updates the score in response to scoreChanged events', async () => {
      await checkWordInputField({ interactable: false });
      checkScoreUpdate(false);
    });
  });
  describe('When playing the game', () => {
    beforeEach(() => {
      gameAreaController.mockIsPlayer = true;
      act(() => {
        gameAreaController.updateTimer(15);
      });
      render(<VehicleTrick gameAreaController={gameAreaController} />);
    });
    describe('Gameplay screen', () => {
      it('displays an input field, timer, score and current word when the player starts game', async () => {
        checkForGameComponents();
        await checkWordInputField({ interactable: true });
      });
      it('increments the timer', async () => {
        checkForIncrementingTimer();
      });
      it('makes a move when word is typed', async () => {
        await checkWordInputField({ interactable: true, checkWord: 'cook' });
      });
      it('field does not update when invalid word is typed', async () => {
        await checkWordInputField({ interactable: true, checkInvalidChar: 'cook>' });
      });
      it('updates the targetWord in response to targetWordChanged events', async () => {
        await checkWordInputField({ interactable: true });
        checkTargetWordUpdate(true);
      });
      it('updates the score in response to scoreChanged events', async () => {
        await checkWordInputField({ interactable: true });
        checkScoreUpdate(true);
      });
    });
    describe('Initials screen', () => {
      beforeEach(() => {
        act(() => {
          gameAreaController.updateTimer(0);
        });
      });
      it('displays initials screen when timer runs out', async () => {
        const highScore = screen.getByLabelText('highscore');
        expect(highScore).toHaveTextContent('Score: 0');
        checkInitialsInputField({ interactable: true });
      });
      it('input field ignores non-alphabetical characters', async () => {
        checkInitialsInputField({ interactable: true, checkInvalidInitials: 'SW^' });
      });
      it('allows user to submit valid initials', async () => {
        checkInitialsInputField({ interactable: true, checkInitials: 'SWE' });
      });
      it('does not allow user to submit initials under 3 characters', async () => {
        checkInitialsInputField({ interactable: true, checkShortInitials: 'SW' });
      });
    });
  });
});
