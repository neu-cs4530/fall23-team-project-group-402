import {
  Box,
  Button,
  Container,
  Input,
  Text,
  Stack,
  useToast,
  FormControl,
} from '@chakra-ui/react';
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
  const [isPlayer, setIsPlayer] = useState(gameAreaController.isPlayer);
  const [targetWord, setTargetWord] = useState(gameAreaController.currentWord);
  const [activeInput, setActiveInput] = useState(false);
  const [userInitials, setUserInitials] = useState('');
  const toast = useToast();

  useEffect(() => {
    const updateTargetWord = () => {
      setTargetWord(gameAreaController.currentWord);
      setInput('');
    };

    const updateIsPlayer = () => {
      setIsPlayer(gameAreaController.isPlayer);
    };

    gameAreaController.addListener('scoreChanged', setScore);
    gameAreaController.addListener('targetWordChanged', updateTargetWord);
    gameAreaController.addListener('gameUpdated', updateIsPlayer);

    return () => {
      gameAreaController.removeListener('scoreChanged', setScore);
      gameAreaController.removeListener('targetWordChanged', updateTargetWord);
      gameAreaController.removeListener('gameUpdated', updateIsPlayer);
    };
  }, [gameAreaController]);

  useEffect(() => {
    // Exit the useEffect if the timer reaches 0
    if (seconds === 0) {
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
    event.preventDefault();
    if (userInitials.length === 3) {
      gameAreaController.gameEnded(userInitials);
    } else {
      toast({
        title: 'Invalid Initials',
        description: 'Username must be 3 characters long',
        status: 'error',
      });
    }
  }

  /**
   * View shown for what an observer sees while a game is being played.
   */
  function pleaseWait() {
    return (
      <Box textAlign='center' aria-label='observer-text'>
        <b>Please wait, someone else is currently playing!</b>
      </Box>
    );
  }

  /**
   * View shown while the game is being played.
   */
  function gameContent({ word }: { word: string }) {
    if (isPlayer) {
      return (
        <FormControl textAlign={'center'}>
          <Box
            display='flex'
            justifyContent='center'
            alignItems='center'
            mt={5}
            fontSize={33}
            fontFamily={'cursive'}
            fontWeight={'bold'}>
            {Array.from({ length: word.length }).map((_, index) => (
              <Box key={index} style={{ marginLeft: '4px', marginRight: '4px' }}>
                {input[index] || '_'}
              </Box>
            ))}
          </Box>
          <Input
            mt={4}
            maxLength={word.length}
            textAlign='center'
            name='title'
            value={input}
            isDisabled={activeInput}
            autoFocus
            onChange={event => {
              const targetValue = event.target.value;
              if (onlyLetters(targetValue)) {
                setInput(targetValue);
              }
              gameAreaController.enterWord(targetValue);
            }}
            variant='unstyled'
            style={{
              opacity: 0,
              top: -57,
              color: 'transparent',
              width: `${word.length * 30}px`,
              height: '35px',
              border: '0px solid black',
            }}
          />
        </FormControl>
      );
    } else {
      return pleaseWait();
    }
  }

  if (!activeInput) {
    return (
      <Container>
        <Stack
          direction={'row'}
          spacing={20}
          fontWeight={'bold'}
          fontFamily={'fantasy'}
          fontSize={24}
          justify={'center'}
          mt={2}>
          <Stack align={'center'}>
            <Text>{seconds} Seconds</Text>
          </Stack>
          <Stack align={'center'}>
            <Text>Score: {score} </Text>
          </Stack>
        </Stack>

        <Box mt={16} textAlign='center' aria-label='tarsget-word'>
          <Text fontFamily={'cursive'} fontWeight={'semibold'} fontSize={33}>
            {targetWord}
          </Text>
          {gameContent({ word: targetWord })}
        </Box>
      </Container>
    );
  } else {
    if (isPlayer) {
      return (
        <Container>
          <Box textAlign='center' aria-label='highscore'>
            <Text fontSize={24} fontWeight={'medium'} fontFamily={'fantasy'} mt={2}>
              Score: {score}
            </Text>
          </Box>
          <Box textAlign='center' mt={8}>
            <Box>
              <FormControl textAlign={'center'}>
                <Box
                  display='flex'
                  justifyContent='center'
                  alignItems='center'
                  mt={12}
                  fontFamily={'fantasy'}>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Box
                      key={index}
                      style={{ marginLeft: '6px', marginRight: '6px' }}
                      fontSize={'42px'}>
                      {userInitials[index] || '_'}
                    </Box>
                  ))}
                </Box>
                <Text mt={-1} fontSize={13} fontFamily={'fantasy'} fontWeight={'medium'}>
                  Enter Your Initials
                </Text>
                <Input
                  mt={7}
                  textAlign='center'
                  name='initials'
                  value={userInitials}
                  width={100}
                  onChange={handleInitialsChange}
                  variant='unstyled'
                  maxLength={3}
                  autoFocus
                  fontFamily={'fantasy'}
                  style={{
                    opacity: 0,
                    top: -88,
                    color: 'transparent',
                    width: `99px`,
                    height: '35px',
                    border: '2px solid black',
                  }}
                />
              </FormControl>
            </Box>
            <Button
              mt={-7}
              bg='lightblue'
              type='submit'
              onClick={handleClick}
              width={100}
              aria-label='submit'
              _hover={{}}
              variant={'unstyled'}
              _active={{ color: 'blue.800' }}
              _focus={{}}
              fontFamily={'georgia'}
              fontSize={19}
              fontWeight={'medium'}>
              Submit
            </Button>
          </Box>
        </Container>
      );
    } else {
      return pleaseWait();
    }
  }
}
