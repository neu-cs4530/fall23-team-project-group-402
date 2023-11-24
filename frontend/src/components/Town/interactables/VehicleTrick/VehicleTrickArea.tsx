import {
  Button,
  Center,
  Text,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  useToast,
  ModalBody,
  Stack,
  useBoolean,
  ModalHeader,
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useState } from 'react';
import { useInteractable, useInteractableAreaController } from '../../../../classes/TownController';
import useTownController from '../../../../hooks/useTownController';
import { GameResult, GameStatus, InteractableID } from '../../../../types/CoveyTownSocket';
import GameAreaInteractable from '../GameArea';
import VehicleTrick from './VehicleTrick';
import VehicleTrickAreaController from '../../../../classes/interactable/VehicleTrickAreaController';
import { TrophyIcon } from './TrophyIcon';
import VehicleTrickLeaderboard from './VehicleTrickLeaderboard';

/**
 * The VehicleTrickArea component renders the VehicleTrick game area.
 * It renders the current state of the area, optionally allowing the player to join the game.
 *
 * It renders the following:
 * - A leaderboard which is passed the game history as a prop
 * - A list of observers' usernames (in a list with the aria-label 'list of observers in the game', one username per-listitem)
 * - If the game is in status WAITING_TO_START or OVER, a button to join the game is displayed, with the text 'Start Game'
 *    - Clicking the button calls the joinGame method on the gameAreaController
 *    - If the method call fails, a toast is displayed with the error message as the description of the toast (and status 'error')
 *    - Once the player joins the game, all the current components disappear
 * - The VehicleTrick component, which is passed the current gameAreaController as a prop (@see VehicleTrick.tsx)
 *
 */
function VehicleTrickArea({ interactableID }: { interactableID: InteractableID }): JSX.Element {
  const gameAreaController =
    useInteractableAreaController<VehicleTrickAreaController>(interactableID);
  const townController = useTownController();

  const [localHistory, setLocalHistory] = useState<GameResult[]>(gameAreaController.localHistory);
  const [persistentHistory, setPersistentHistory] = useState<GameResult[]>(
    gameAreaController.persistentHistory,
  );
  const [gameStatus, setGameStatus] = useState<GameStatus>(gameAreaController.status);
  const [canPlay, setCanPlay] = useState<boolean>(gameAreaController.canPlay);
  const [startingGame, setStartingGame] = useState(false);
  const [leaderboardView, setLeaderboardView] = useBoolean();
  const toast = useToast();

  useEffect(() => {
    townController.pause();
    const updateGameState = () => {
      setLocalHistory(gameAreaController.localHistory);
      setGameStatus(gameAreaController.status || 'WAITING_TO_START');
      setPersistentHistory(gameAreaController.persistentHistory);
      setCanPlay(gameAreaController.canPlay);
    };
    gameAreaController.addListener('gameUpdated', updateGameState);
    // Remove game end toast later
    const onGameEnd = () => {
      toast({
        title: 'Game over',
        description: 'Time has concluded',
        status: 'success',
      });
    };
    gameAreaController.addListener('gameEnd', onGameEnd);
    return () => {
      gameAreaController.removeListener('gameEnd', onGameEnd);
      gameAreaController.removeListener('gameUpdated', updateGameState);
    };
  }, [townController, gameAreaController, toast]);

  if (gameStatus === 'IN_PROGRESS') {
    return (
      <ModalBody bgImage={'./images/keydash.png'} bgColor={'lightblue'} maxWidth={'full'}>
        <VehicleTrick gameAreaController={gameAreaController} />
      </ModalBody>
    );
  } else if (leaderboardView) {
    return (
      <>
        <ModalHeader bgColor={'lightblue'}>
          <Button
            onClick={setLeaderboardView.toggle}
            variant={'ghost'}
            fontSize={12}
            _hover={{}}
            mt={-5}
            ml={-6}
            _active={{ bgColor: 'lightblue' }}
            _focus={{}}
            bgColor={'lightblue'}
            textColor={'black'}
            textAlign={'center'}
            fontWeight={'medium'}
            fontFamily={'courier'}>
            Back
          </Button>
          {/* <Text as={'span'} fontFamily={'cursive'} ml={20}>
            Leaderboard
          </Text> */}
        </ModalHeader>
        <ModalBody bgColor={'lightblue'}>
          <VehicleTrickLeaderboard
            localResults={localHistory}
            persistentResults={persistentHistory}
          />
        </ModalBody>
      </>
    );
  } else {
    return (
      <ModalBody
        bgImage={'./images/keydash.png'}
        bgColor={'lightblue'}
        maxHeight={'450'}
        maxWidth={'full'}
        textAlign={'center'}
        fontSize={48}
        fontWeight={'black'}
        fontFamily={'cursive'}>
        <Center>
          <Stack direction={'column'} spacing={5} justify={'center'} align={'center'}>
            <Stack spacing={0} align={'center'}>
              <Text mt={8} fontFamily={'cursive'}>
                TricKey Typing
              </Text>
            </Stack>
            <Stack spacing={0} align={'center'}>
              <Button
                mt={5}
                onClick={async () => {
                  if (canPlay) {
                    setStartingGame(true);
                    try {
                      await gameAreaController.joinGame();
                    } catch (err) {
                      toast({
                        title: 'Error joining game',
                        description: (err as Error).toString(),
                        status: 'error',
                      });
                    }
                    setStartingGame(false);
                  } else {
                    toast({
                      title: 'Unable to Start Game',
                      description: 'Player must have a vehicle equipped to start a game!',
                      status: 'error',
                    });
                  }
                }}
                isLoading={startingGame}
                disabled={startingGame}
                variant={'ghost'}
                fontFamily={'courier'}
                fontSize={28}
                _hover={{}}
                _active={{ bgColor: 'blue.100' }}
                _focus={{}}>
                START GAME
              </Button>
            </Stack>
            <Stack spacing={0} align={'center'}>
              <Button
                variant={'ghost'}
                name='leaderboard'
                role={'leaderboard'}
                _hover={{}}
                alignContent={'center'}
                width={1}
                onClick={setLeaderboardView.toggle}
                _active={{ bgColor: 'blue.100' }}
                _focus={{}}
                mt={3}>
                <TrophyIcon fontSize={100} role={'leaderboard'} />
              </Button>
            </Stack>
          </Stack>
        </Center>
      </ModalBody>
    );
  }
}

/**
 * A wrapper component for the VehicleTrickArea component.
 * Determines if the player is currently in a vehicle trick area on the map, and if so,
 * renders the VehicleTrickArea component in a modal.
 *
 */
export default function VehicleTrickAreaWrapper(): JSX.Element {
  const gameArea = useInteractable<GameAreaInteractable>('gameArea');
  const townController = useTownController();
  const closeModal = useCallback(() => {
    if (gameArea) {
      townController.interactEnd(gameArea);
      const controller = townController.getGameAreaController(gameArea);
      townController.unPause();
      controller.leaveGame();
    }
  }, [townController, gameArea]);

  if (gameArea && gameArea.getData('type') === 'VehicleTrick') {
    return (
      <Modal isOpen={true} onClose={closeModal} closeOnOverlayClick={false}>
        <ModalOverlay bg={'none'} />
        <ModalContent borderWidth={8} height={'458'} maxWidth={'616'} borderColor={'gold'}>
          <ModalCloseButton />
          <VehicleTrickArea interactableID={gameArea.name} />
        </ModalContent>
      </Modal>
    );
  }
  return <></>;
}
