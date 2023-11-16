import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Center,
  Container,
  Heading,
  List,
  ListItem,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useToast,
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useState } from 'react';
import PlayerController from '../../../../classes/PlayerController';
import { useInteractable, useInteractableAreaController } from '../../../../classes/TownController';
import useTownController from '../../../../hooks/useTownController';
import { GameStatus, InteractableID } from '../../../../types/CoveyTownSocket';
import GameAreaInteractable from '../GameArea';
import VehicleTrick from './VehicleTrick';
import VehicleTrickAreaController from '../../../../classes/interactable/VehicleTrickAreaController';

/**
 * The VehicleTrickArea component renders the VehicleTrick game area.
 * It renders the current state of the area, optionally allowing the player to join the game.
 *
 * It renders the following:
 * - A leaderboard (@see Leaderboard.tsx), which is passed the game history as a prop
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

  // const [history, setHistory] = useState<GameResult[]>(gameAreaController.history);
  const [gameStatus, setGameStatus] = useState<GameStatus>(gameAreaController.status);
  const [observers, setObservers] = useState<PlayerController[]>(gameAreaController.observers);
  const [startingGame, setStartingGame] = useState(false);
  const [player, setPlayer] = useState<PlayerController | undefined>(gameAreaController.player);
  const toast = useToast();

  useEffect(() => {
    townController.pause();
    const updateGameState = () => {
      // setHistory(gameAreaController.history);
      setGameStatus(gameAreaController.status || 'WAITING_TO_START');
      setObservers(gameAreaController.observers);
      setPlayer(gameAreaController.player);
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

  const handleClick = async () => {
    if (townController.ourPlayer.vehicle) {
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
        description: 'Player must have vehicle equipped to start game!',
        status: 'error',
      });
    }
  };

  if (gameStatus === 'IN_PROGRESS') {
    return <VehicleTrick gameAreaController={gameAreaController} />;
  } else {
    return (
      <Container>
        <Accordion allowToggle>
          <AccordionItem>
            <Heading as='h3'>
              <AccordionButton>
                <Box as='span' flex='1' textAlign='left'>
                  Leaderboard
                  <AccordionIcon />
                </Box>
              </AccordionButton>
            </Heading>
            <AccordionPanel>
              <>To-Do</>
            </AccordionPanel>
          </AccordionItem>
          <AccordionItem>
            <Heading as='h3'>
              <AccordionButton>
                <Box as='span' flex='1' textAlign='left'>
                  Current Observers
                  <AccordionIcon />
                </Box>
              </AccordionButton>
            </Heading>
            <AccordionPanel>
              <List aria-label='list of observers in the game'>
                {observers.map(currPlayer => {
                  return <ListItem key={currPlayer.id}>{currPlayer.userName}</ListItem>;
                })}
              </List>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
        <Center>
          <Button mt={4} onClick={handleClick} isLoading={startingGame} disabled={startingGame}>
            Start Game
          </Button>
        </Center>
      </Container>
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
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{gameArea.name}</ModalHeader>
          <ModalCloseButton />
          <VehicleTrickArea interactableID={gameArea.name} />;
        </ModalContent>
      </Modal>
    );
  }
  return <></>;
}
