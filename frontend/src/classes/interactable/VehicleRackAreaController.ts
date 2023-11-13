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
export type VehicleRackAreaEvents = BaseInteractableEventMap & {
  /**
   * An equipChange event indicates that the player has changed their vehicle
   * Listeners are passed the new state in the parameter `isPlaying`
   */
  equipChange: (vehicle: Vehicle | undefined) => void;

  unEquipChange: (vehicle: Vehicle | undefined) => void;
};

export default class VehicleRackAreaController extends InteractableAreaController<
  VehicleRackAreaEvents,
  VehicleRackAreaModel
> {
  private _vehicle?: VehicleType;

  protected _townController: TownController;

  /**
   * Create a new VehicleRackAreaController
   * @param id
   * @param vehicle
   * @param townController
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
    const ourPlayer = this.occupants.find(
      occupant => occupant.id === this._townController.ourPlayer.id,
    );
    if (ourPlayer?.vehicle?.vehicleType !== this._vehicle) {
      ourPlayer?.equipVehicle(this._vehicle);
      if (this._vehicle === undefined) {
        this.emit('unequipChange', ourPlayer?.vehicle);
      } else {
        this.emit('equipChange', ourPlayer?.vehicle);
      }
    }
  }

  public toInteractableAreaModel(): VehicleRackAreaModel {
    return {
      id: this.id,
      occupants: this.occupants.map(player => player.id),
      type: 'VehicleRackArea',
    };
  }
}
