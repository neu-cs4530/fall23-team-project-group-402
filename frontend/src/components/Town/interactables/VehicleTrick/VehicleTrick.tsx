import { Box, Button, Center, chakra, Container, Input, useToast } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
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
  const [title, setTitle] = useState<string>('');
  const [seconds, setSeconds] = useState(15);
  const [score, setScore] = useState(0);
  const [targetWord, setTargetWord] = useState('');
  const toast = useToast();

  useEffect(() => {
    const updateTargetWord = () => {
      setTargetWord(gameAreaController.currentWord);
      setTitle('');
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
      return;
    }

    // Update the timer every second
    const timerInterval = setInterval(() => {
      setSeconds(prevSeconds => prevSeconds - 1);
    }, 1000);

    // Clean up the interval on component unmount
    return () => clearInterval(timerInterval);
  }, [seconds]);

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
        value={title}
        placeholder='type word here'
        autoFocus
        onChange={event => {
          setTitle(event.target.value);
          gameAreaController.enterWord(event.target.value);
        }}
      />
    </Container>
  );
}
