import {
  ConversationArea,
  Interactable,
  TicTacToeGameState,
  ViewingArea,
  GameArea,
  VehicleTrickGameState,
} from './CoveyTownSocket';

/**
 * Test to see if an interactable is a conversation area
 */
export function isConversationArea(interactable: Interactable): interactable is ConversationArea {
  return interactable.type === 'ConversationArea';
}

/**
 * Test to see if an interactable is a viewing area
 */
export function isViewingArea(interactable: Interactable): interactable is ViewingArea {
  return interactable.type === 'ViewingArea';
}

/**
 * Test to see if an interactable is a vehicle rack area
 */
export function isVehicleRackArea(interactable: Interactable): interactable is ViewingArea {
  return interactable.type === 'VehicleRackArea';
}

export function isTicTacToeArea(
  interactable: Interactable,
): interactable is GameArea<TicTacToeGameState> {
  return interactable.type === 'TicTacToeArea';
}

export function isVehicleTrickArea(
  interactable: Interactable,
): interactable is GameArea<VehicleTrickGameState> {
  return interactable.type === 'VehicleTrickArea';
}
