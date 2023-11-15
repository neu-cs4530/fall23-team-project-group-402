import { Box, Button, Container, Input, useToast } from '@chakra-ui/react';
import React, { ChangeEvent, useEffect, useState } from 'react';
import VehicleTrickAreaController from '../../../../classes/interactable/VehicleTrickAreaController';

export type VehicleTrickGameProps = {
  gameAreaController: VehicleTrickAreaController;
};

/**
 * A component that renders the VehicleTrick game
 *
 * Renders a timer (which immediately begins counting down), the current word that needs to be typed,
 * and an input field that is automatically selected. The input field only accepts letters.
 *
 * The timer is rerendered each second to represent the countdown, the input field rerenders each time
 * the player types in a letter, and the word displayed rerenders whenever the user spells it correctly.
 *
 * Once the timer runs out, the display automatically changes to display the user's score, an 3-letter
 * input field for their username, and a submit button. The input field only accepts letter inputs with
 * a length of three characters.
 *
 * @param gameAreaController the controller for the VehicleTrick game
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
