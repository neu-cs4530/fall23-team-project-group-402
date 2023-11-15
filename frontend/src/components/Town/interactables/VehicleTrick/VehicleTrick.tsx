import { Box, Button, Container, Input, useToast } from '@chakra-ui/react';
import React, { ChangeEvent, useEffect, useState } from 'react';
import VehicleTrickAreaController from '../../../../classes/interactable/VehicleTrickAreaController';

export type VehicleTrickGameProps = {
  gameAreaController: VehicleTrickAreaController;
};

/**
 * A component that renders the TicTacToe board
 *
 * Renders the TicTacToe board as a "StyledTicTacToeBoard", which consists of 9 "StyledTicTacToeSquare"s
 * (one for each cell in the board, starting from the top left and going left to right, top to bottom).
 * Each StyledTicTacToeSquare has an aria-label property that describes the cell's position in the board,
 * formatted as `Cell ${rowIndex},${colIndex}`.
 *
 * The board is re-rendered whenever the board changes, and each cell is re-rendered whenever the value
 * of that cell changes.
 *
 * If the current player is in the game, then each StyledTicTacToeSquare is clickable, and clicking
 * on it will make a move in that cell. If there is an error making the move, then a toast will be
 * displayed with the error message as the description of the toast. If it is not the current player's
 * turn, then the StyledTicTacToeSquare will be disabled.
 *
 * @param gameAreaController the controller for the TicTacToe game
 */
export default function VehicleTrick({ gameAreaController }: VehicleTrickGameProps): JSX.Element {
  const [input, setInput] = useState<string>('');
  const [seconds, setSeconds] = useState(15);
  const [score, setScore] = useState(0);
  const [targetWord, setTargetWord] = useState('');
  const [activeInput, setActiveInput] = useState(false);
  const [userInitials, setUserInitials] = useState('');
  const toast = useToast();

  useEffect(() => {
    const updateTargetWord = () => {
      setTargetWord(gameAreaController.currentWord);
      setInput('');
    };

    gameAreaController.addListener('scoreChanged', setScore);
    gameAreaController.addListener('targetWordChanged', updateTargetWord);
    return () => {
      gameAreaController.removeListener('scoreChanged', setScore);
      gameAreaController.removeListener('targetWordChanged', updateTargetWord);
    };
  }, [gameAreaController]);

  useEffect(() => {
    // Exit the useEffect if the timer reaches 0
    if (seconds === 0) {
      toast({
        title: 'Game over',
        description: 'Time has concluded',
        status: 'success',
      });
      setInput('');
      setActiveInput(true);
      return;
    }

    // Update the timer every second
    const timerInterval = setInterval(() => {
      setSeconds(prevSeconds => prevSeconds - 1);
    }, 1000);

    // Clean up the interval on component unmount
    return () => clearInterval(timerInterval);
  }, [seconds, toast]);

  function onlyLetters(word: string) {
    const validCharacters = /^[A-Za-z]+$/;
    return validCharacters.test(word) || word === '';
  }

  const handleInitialsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.slice(0, 3);
    if (onlyLetters(inputValue)) {
      setUserInitials(inputValue.toUpperCase());
    }
  };

  function handleClick(event: { preventDefault: () => void }) {
    event.preventDefault(); // magic, sorry.

    toast({
      title: 'Acknowledgement',
      description: 'User Initials have been acknowledged',
      status: 'success',
    });
  }

  if (!activeInput) {
    return (
      <Container>
        <Box>
          <b>Time Left:</b> {seconds} seconds
        </Box>
        <Box mt={1}>
          <b>Score: </b> {score}
        </Box>
        <Box mt={4} textAlign='center'>
          {targetWord}
        </Box>
        <Input
          mt={4}
          textAlign='center'
          name='title'
          value={input}
          isDisabled={activeInput}
          placeholder='type word here'
          autoFocus
          onChange={event => {
            const targetValue = event.target.value;
            if (onlyLetters(targetValue)) {
              setInput(targetValue);
            }
            gameAreaController.enterWord(targetValue);
          }}
        />
      </Container>
    );
  } else {
    return (
      <Container>
        <Box textAlign='center'>
          <b>Your Score: </b> {score}
        </Box>
        <Box textAlign='center' mt={4}>
          <Box>
            <b>Enter Your Three-Letter Initials:</b>
          </Box>
          <Box>
            <Input
              mt={4}
              textAlign='center'
              name='initials'
              placeholder='initials'
              value={userInitials}
              width={100}
              onChange={handleInitialsChange}
            />
          </Box>
          <Button mt={4} bg='lightblue' type='submit' onClick={handleClick} width={100}>
            Submit
          </Button>
        </Box>
      </Container>
    );
  }
}
