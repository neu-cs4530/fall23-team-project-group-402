import { VehicleType } from '../../types/CoveyTownSocket';
import BikeVehicle from './BikeVehicle';
import HorseVehicle from './HorseVehicle';
import SkateboardVehicle from './SkateboardVehicle';
import Vehicle from './Vehicle';

function testVehicleFields(vehicle: Vehicle, speedMultiplier: number, type: VehicleType) {
  const vehicleModel = vehicle.toVehicleModel();

  expect(vehicleModel.speedMultiplier).toEqual(speedMultiplier);
  expect(vehicleModel.vehicleType).toEqual(type);
}

describe('Vehicle', () => {
  test('BikeVehicle has the correct attributes', () => {
    const vehicle = new BikeVehicle();
    testVehicleFields(vehicle, 2, 'bike');
  });
  test('HorseVehicle has the correct attributes', () => {
    const vehicle = new HorseVehicle();
    testVehicleFields(vehicle, 3, 'horse');
  });
  test('SkateboardVehicle has the correct attributes', () => {
    const vehicle = new SkateboardVehicle();
    testVehicleFields(vehicle, 1.5, 'skateboard');
  });
});
