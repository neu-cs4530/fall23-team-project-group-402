import { Vehicle, VehicleRackArea as VehicleRackAreaModel } from '../../types/CoveyTownSocket';
import InteractableAreaController, { BaseInteractableEventMap } from './InteractableAreaController';

/**
 * The events that a ViewingAreaController can emit
 */
export type VehicleRackAreaEvents = BaseInteractableEventMap & {
  /**
   * A vehicleChange event indicates that the vehicle selected for this vehicle rack area has changed.
   * Must implement Vehicle type to
   */
  vehicleChange: (vehicle: Vehicle | undefined) => void;
};

export default class VehicleRackAreaController extends InteractableAreaController<
  VehicleRackAreaEvents,
  VehicleRackAreaModel
> {
  private _vehicle?: Vehicle;

  /**
   * Create a new ConversationAreaController
   * @param id
   * @param topic
   */
  constructor(id: string, vehicle?: Vehicle) {
    super(id);
    this._vehicle = vehicle;
  }

  public isActive() {
    return this.occupants.length > 0;
  }

  protected _updateFrom(): void {
    // Do I need this?
  }

  /**
   * Set vehicle to undefined when selecting no vehicle
   */
  set vehicle(vehicle: Vehicle | undefined) {
    // May need to change
    if (this._vehicle !== vehicle) {
      this.emit('vehicleChange', vehicle);
    }
    this.vehicle = vehicle;
  }

  /**
   * Get vehicle will return undefined when there is no vehicle selected
   * OR when the player selects the no vehicle option
   */
  get vehicle(): Vehicle | undefined {
    return this._vehicle;
  }

  public toInteractableAreaModel(): VehicleRackAreaModel {
    return {
      id: this.id,
      occupants: this.occupants.map(player => player.id), //???
      vehicle: this._vehicle, //Right now model doesnt have this attribute, so may need to remove
      type: 'VehicleRackArea',
    };
  }
}
