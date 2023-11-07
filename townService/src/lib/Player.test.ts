import { createPlayerForTesting } from '../TestUtils';
import BikeVehicle from '../town/vehicles/BikeVehicle';
import HorseVehicle from '../town/vehicles/HorseVehicle';
import SkateboardVehicle from '../town/vehicles/SkateboardVehicle';
import Player from './Player';

describe('Player', () => {
  let player: Player;

  beforeEach(() => {
    player = createPlayerForTesting();
  });

  test('players should not have a vehicle equipped when created', () => {
    expect(player.vehicle).toBeUndefined();
  });
  describe('equipVehicle', () => {
    it('equips a Bike vehicle', () => {
      expect(player.vehicle).toBeUndefined();
      player.equipVehicle('bike');
      expect(player.vehicle).toEqual(new BikeVehicle());
    });
    it('equips a Horse vehicle', () => {
      expect(player.vehicle).toBeUndefined();
      player.equipVehicle('horse');
      expect(player.vehicle).toEqual(new HorseVehicle());
    });
    it('equips a Skateboard vehicle', () => {
      expect(player.vehicle).toBeUndefined();
      player.equipVehicle('skateboard');
      expect(player.vehicle).toEqual(new SkateboardVehicle());
    });
    it('updates the equipped vehicle if the player already has one equipped', () => {
      player.equipVehicle('bike');
      expect(player.vehicle).toEqual(new BikeVehicle());
      player.equipVehicle('skateboard');
      expect(player.vehicle).toEqual(new SkateboardVehicle());
    });
    it('allow player to re-equip the same vehicle', () => {
      player.equipVehicle('bike');
      expect(player.vehicle).toEqual(new BikeVehicle());
      player.equipVehicle('bike');
      expect(player.vehicle).toEqual(new BikeVehicle());
    });
  });
  describe('unEquipVehicle', () => {
    it('does nothing when the player does not have a vehicle equipped', () => {
      expect(player.vehicle).toBeUndefined();
      player.unEquipVehicle();
      expect(player.vehicle).toBeUndefined();
    });
    it('unequips a Bike vehicle', () => {
      player.equipVehicle('bike');
      expect(player.vehicle).toEqual(new BikeVehicle());

      player.unEquipVehicle();

      expect(player.vehicle).toBeUndefined();
    });
    it('unequips a Horse vehicle', () => {
      player.equipVehicle('horse');
      expect(player.vehicle).toEqual(new HorseVehicle());

      player.unEquipVehicle();

      expect(player.vehicle).toBeUndefined();
    });
    it('unequips a Skateboard vehicle', () => {
      player.equipVehicle('skateboard');
      expect(player.vehicle).toEqual(new SkateboardVehicle());

      player.unEquipVehicle();

      expect(player.vehicle).toBeUndefined();
    });
  });
});
