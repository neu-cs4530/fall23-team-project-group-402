import { VehicleType, Vehicle as VehicleModel } from '../../types/CoveyTownSocket';

export default abstract class Vehicle {
  protected speedMultiplier: number;

  protected vehicleType: VehicleType;

  constructor(speedMultiplier: number, vehicleType: VehicleType) {
    this.speedMultiplier = speedMultiplier;
    this.vehicleType = vehicleType;
  }

  toVehicleModel(): VehicleModel {
    return {
      speedMultiplier: this.speedMultiplier,
      vehicleType: this.vehicleType,
    };
  }
}
