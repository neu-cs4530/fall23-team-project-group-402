import { Vehicle } from '../types/CoveyTownSocket';

export const WALKING_SPEED = 175;

/**
 * Extracts logic for getting the user's player speed. This class
 * was added to increase testability within the PlayerController.
 */
export default class SpeedUtils {
  /**
   * Determines the speed of the player depending on if they have any vehicle equipped.
   * @param vehicle The vehicle the player is using, if any
   * @returns The speed the player should be moving
   */
  static playerSpeed(vehicle: Vehicle | undefined): number {
    return vehicle ? vehicle.speedMultiplier * WALKING_SPEED : WALKING_SPEED;
  }
}
