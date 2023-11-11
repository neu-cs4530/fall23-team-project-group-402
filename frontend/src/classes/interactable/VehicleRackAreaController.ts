import BikeVehicle from '../../../../townService/src/town/vehicles/BikeVehicle';
import HorseVehicle from '../../../../townService/src/town/vehicles/HorseVehicle';
import SkateboardVehicle from '../../../../townService/src/town/vehicles/SkateboardVehicle';
import {
  Vehicle,
  VehicleRackArea as VehicleRackAreaModel,
  VehicleType,
} from '../../types/CoveyTownSocket';
import TownController from '../TownController';
import InteractableAreaController, { BaseInteractableEventMap } from './InteractableAreaController';

/**
 * The events that a VehicleRackAreaController can emit
 */
export type VehicleRackAreaEvents = BaseInteractableEventMap;

export default class VehicleRackAreaController extends InteractableAreaController<
  VehicleRackAreaEvents,
  VehicleRackAreaModel
> {
  private _vehicle?: VehicleType;

  protected _townController: TownController;

  /**
   * Create a new VehicleRackAreaController
   * @param id
   * @param topic
   */
  constructor(id: string, townController: TownController, vehicle?: VehicleType) {
    super(id);
    this._townController = townController;
    this._vehicle = vehicle;
  }

  public isActive() {
    return this.occupants.length > 0;
  }

  protected _updateFrom(): void {}

  /**
   * Set vehicle to undefined when selecting no vehicle
   */
  set vehicle(vehicle: VehicleType | undefined) {
    this._vehicle = vehicle;
  }

  /**
   * Get vehicle will return undefined when there is no vehicle selected
   * OR when the player selects the no vehicle option
   */
  get vehicle(): VehicleType | undefined {
    return this._vehicle;
  }

  public equipVehicle(): void {
    let vehicle: Vehicle | undefined = undefined;
    switch (this._vehicle) {
      case 'bike':
        vehicle = new BikeVehicle();
        break;
      case 'horse':
        vehicle = new HorseVehicle();
        break;
      case 'skateboard':
        vehicle = new SkateboardVehicle();
        break;
      default:
        vehicle = undefined;
        break;
    }
    this._townController.ourPlayer.vehicle = vehicle;
  }

  public toInteractableAreaModel(): VehicleRackAreaModel {
    return {
      id: this.id,
      occupants: this.occupants.map(player => player.id),
      type: 'VehicleRackArea',
    };
  }
}
