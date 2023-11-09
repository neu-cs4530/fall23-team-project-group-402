import { Vehicle, VehicleType } from '../types/CoveyTownSocket';
import SpeedUtils from './SpeedUtils';

class MockVehicle implements Vehicle {
  vehicleType: VehicleType = 'bike';

  speedMultiplier = 1.5;
}

describe('SpeedUtils', () => {
  const walkingSpeed = 175;
  let mockVehicle: MockVehicle;

  beforeEach(() => {
    mockVehicle = new MockVehicle();
  });

  describe('playerSpeed', () => {
    it("uses the player's walking speed if the vehicle is undefined", () => {
      expect(SpeedUtils.playerSpeed(undefined)).toEqual(walkingSpeed);
    });
    it('updates the player speed when given a vehicle', () => {
      expect(SpeedUtils.playerSpeed(mockVehicle)).toEqual(walkingSpeed * 1.5);
      mockVehicle.speedMultiplier = 0.5;
      expect(SpeedUtils.playerSpeed(mockVehicle)).toEqual(walkingSpeed * 0.5);
    });
  });
});
