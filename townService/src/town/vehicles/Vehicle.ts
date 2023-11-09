import { VehicleType, Vehicle as VehicleModel } from '../../types/CoveyTownSocket';

export default abstract class Vehicle {
  public speedMultiplier: number;

  public vehicleType: VehicleType;

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
