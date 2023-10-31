import { VehicleType } from '../../types/CoveyTownSocket';

export default abstract class Vehicle {
  private _speedMultiplier: number;

  private _vehicleType: VehicleType;

  constructor(speedMultiplier: number, vehicleType: VehicleType) {
    this._speedMultiplier = speedMultiplier;
    this._vehicleType = vehicleType;
  }

  public get speedMultiplier(): number {
    return this._speedMultiplier;
  }

  public get vehicleType(): VehicleType {
    return this._vehicleType;
  }
}
