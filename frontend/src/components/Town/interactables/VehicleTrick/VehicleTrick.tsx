import { Box, Button, chakra, Container, useToast } from '@chakra-ui/react';
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
  return <Box>Sup</Box>;
}
