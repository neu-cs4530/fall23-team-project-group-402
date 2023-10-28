import { Vehicle } from '../../types/CoveyTownSocket';

export default class BikeVehicle extends Vehicle {
  public constructor() {
    super(2, 'bike');
  }
}
