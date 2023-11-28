import {
  Box,
  Button,
  Container,
  Input,
  Text,
  Stack,
  useToast,
  FormControl,
  Center,
  ModalBody,
} from '@chakra-ui/react';
import React, { ChangeEvent, useEffect, useState } from 'react';
import VehicleTrickAreaController from '../../../../classes/interactable/VehicleTrickAreaController';
import PlayerSprite from './PlayerSprite';

export type VehicleTrickGameProps = {
  gameAreaController: VehicleTrickAreaController;
  vehicleType: string | undefined;
  usePhaser: boolean;
};

/**
 * A component that renders the VehicleTrick game
 *
 * Renders a timer connected to the backend, the current word that needs to be typed,
 * and an input field that is automatically selected. The input field only accepts letters.
 *
 * The timer is rerendered each time the backend updates the timer, the input field rerenders each time
 * the player types in a letter, and the word displayed rerenders whenever the user spells it correctly.
 *
 * Once the timer runs out, the display automatically changes to display the user's score, an 3-letter
 * input field for their username, and a submit button. The input field only accepts letter inputs with
 * a length of three characters.
 *
 * @param gameAreaController the controller for the VehicleTrick game
 */
export default function VehicleTrick({
  gameAreaController,
  vehicleType,
  usePhaser,
}: VehicleTrickGameProps): JSX.Element {
  const [input, setInput] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(gameAreaController.currentTimeLeft);
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

    const updateTimeLeft = () => {
      setTimeLeft(gameAreaController.currentTimeLeft);
      if (gameAreaController.currentTimeLeft == 0) {
        setInput('');
        setActiveInput(true);
      }
    };

    const updateScore = () => {
      setScore(gameAreaController.currentScore);
    };

    gameAreaController.addListener('scoreChanged', updateScore);
    gameAreaController.addListener('targetWordChanged', updateTargetWord);
    gameAreaController.addListener('timeLeftChanged', updateTimeLeft);
    gameAreaController.addListener('gameUpdated', updateIsPlayer);

    return () => {
      gameAreaController.removeListener('scoreChanged', updateScore);
      gameAreaController.removeListener('targetWordChanged', updateTargetWord);
      gameAreaController.removeListener('timeLeftChanged', updateTimeLeft);
      gameAreaController.removeListener('gameUpdated', updateIsPlayer);
    };
  }, [gameAreaController]);

  /**
   * Determines if the given word is valid (only contains characters A/a-Z/z)
   * @param word The word to check
   * @returns True if the word contains only valid character, false otherwise.
   */
  function onlyLetters(word: string) {
    const validCharacters = /^[A-Za-z]+$/;
    return validCharacters.test(word) || word === '';
  }

  /**
   * Handles updating state when the users enters their intials.
   * @param e The input change event
   */
  const handleInitialsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.slice(0, 3);
    if (onlyLetters(inputValue)) {
      setUserInitials(inputValue.toUpperCase());
    }
  };

  /**
   * Handles updating state when the user clicks the submit button on the initials screen.
   * @param event The click event
   */
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
   * Event handler for when the user enters a word.
   * @param event The input event
   */
  async function enterWord(event: React.ChangeEvent<HTMLInputElement>) {
    const targetValue = event.target.value;
    if (onlyLetters(targetValue)) {
      setInput(targetValue);
    }

    try {
      await gameAreaController.enterWord(targetValue);
    } catch (err) {
      toast({
        title: 'Error entering word',
        description: (err as Error).toString(),
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
            fontFamily={'courier'}
            fontWeight={'semibold'}>
            {Array.from({ length: word.length }).map((_, index) => (
              <Box key={index} style={{ marginLeft: '2px', marginRight: '2px' }}>
                {input[index] || '_'}
              </Box>
            ))}
          </Box>
          <Input
            mt={4}
            maxLength={word.length}
            textAlign='center'
            placeholder='type word here'
            name='title'
            value={input}
            isDisabled={activeInput}
            autoFocus
            onChange={async event => enterWord(event)}
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
      return (
        <Container mt={0}>
          <Box mt={30}>{pleaseWait()}</Box>
        </Container>
      );
    }
  }

  /**
   * Renders the player sprite.
   * NOTE: jest is unable to render Phaser game scenes, so we have a flag
   * to replace the player sprite with text in our unit tests.
   * @returns the rendered player sprite
   */
  function playerSprite() {
    if (usePhaser) {
      return <PlayerSprite vehicleType={vehicleType} targetWord={targetWord} />;
    }

    return (
      <Box textAlign='center' aria-label='player-sprite'>
        <b>Player Sprite</b>
      </Box>
    );
  }

  if (!activeInput) {
    return (
      <ModalBody bgImage={'./images/emptyramp.png'} bgColor={'lightblue'} maxWidth={'full'}>
        <Container>
          <Center>
            <Stack direction={'column'} spacing={5} justify={'center'} align={'center'}>
              <Stack
                direction={'row'}
                spacing={20}
                fontWeight={'bold'}
                fontFamily={'fantasy'}
                fontSize={24}
                justify={'center'}
                mt={2}>
                <Stack align={'center'}>
                  <Text aria-label='timer'>{timeLeft} Seconds</Text>
                </Stack>
                <Stack align={'center'}>
                  <Text aria-label='score'>Score: {score} </Text>
                </Stack>
              </Stack>
              <Stack align={'cente'}>
                <Box mt={16} textAlign='center' aria-label='target-word'>
                  <Text fontFamily={'courier'} fontWeight={'semibold'} fontSize={33}>
                    {targetWord}
                  </Text>
                  {gameContent({ word: targetWord })}
                </Box>
              </Stack>
              <Stack align={'center'} mt={-100}>
                {playerSprite()}
              </Stack>
            </Stack>
          </Center>
        </Container>
      </ModalBody>
    );
  } else {
    if (isPlayer) {
      return (
        <ModalBody bgImage={'./images/keydash.png'} bgColor={'lightblue'} maxWidth={'full'}>
          <Container>
            <Box textAlign='center' aria-label='highscore'>
              <Text fontSize={24} fontWeight={'bold'} fontFamily={'courier'} mt={2}>
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
                    fontFamily={'courier'}>
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Box
                        key={index}
                        style={{ marginLeft: '6px', marginRight: '6px' }}
                        fontSize={'42px'}>
                        {userInitials[index] || '_'}
                      </Box>
                    ))}
                  </Box>
                  <Text mt={0} fontSize={16} fontFamily={'courier'} fontWeight={'medium'}>
                    Enter Your Initials
                  </Text>
                  <Input
                    mt={7}
                    textAlign='center'
                    name='initials'
                    placeholder='initials'
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
                _active={{ color: 'blue.800' }}
                _focus={{}}
                fontFamily={'courier'}
                fontSize={19}
                variant={'ghost'}>
                Submit
              </Button>
            </Box>
          </Container>
        </ModalBody>
      );
    } else {
      return (
        <ModalBody bgImage={'./images/keydash.png'} bgColor={'lightblue'} maxWidth={'full'}>
          <Container mt={0}>
            <Box mt={130}>{pleaseWait()}</Box>
          </Container>
        </ModalBody>
      );
    }
  }
}
