import { mock, mockClear } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import Player from '../lib/Player';
import { getLastEmittedEvent } from '../TestUtils';
import { PlayerID, TownEmitter } from '../types/CoveyTownSocket';
import VehicleRackArea from './VehicleRackArea';

describe('VehicleRackArea', () => {
  const testAreaBox = { x: 100, y: 100, width: 100, height: 100 };
  let testArea: VehicleRackArea;
  const townEmitter = mock<TownEmitter>();
  let newPlayer: Player;
  const id = nanoid();
  const occupants: PlayerID[] = [];

  beforeEach(() => {
    mockClear(townEmitter);
    testArea = new VehicleRackArea({ id, occupants }, testAreaBox, townEmitter);
    newPlayer = new Player(nanoid(), mock<TownEmitter>());
    testArea.add(newPlayer);
  });

  describe('remove', () => {
    it('Removes the player from the list of occupants and emits an interactableUpdate event', () => {
      // Add another player so that we are not also testing what happens when the last player leaves
      const extraPlayer = new Player(nanoid(), mock<TownEmitter>());
      testArea.add(extraPlayer);
      testArea.remove(newPlayer);

      expect(testArea.occupantsByID).toEqual([extraPlayer.id]);
      const lastEmittedUpdate = getLastEmittedEvent(townEmitter, 'interactableUpdate');
      expect(lastEmittedUpdate).toEqual({
        id,
        occupants: [extraPlayer.id],
        type: 'VehicleRackArea',
      });
    });
  });
  describe('add', () => {
    it('Adds the player to the occupants list', () => {
      expect(testArea.occupantsByID).toEqual([newPlayer.id]);
    });
    it('Adds the extra player to the occupants list', () => {
      const extraPlayer = new Player(nanoid(), mock<TownEmitter>());
      testArea.add(extraPlayer);
      expect(testArea.occupantsByID).toEqual([newPlayer.id, extraPlayer.id]);
    });
    it('Emits an update for their location', () => {
      expect(newPlayer.location.interactableID).toEqual(id);
      const lastEmittedMovement = getLastEmittedEvent(townEmitter, 'playerMoved');
      expect(lastEmittedMovement.location.interactableID).toEqual(id);
    });
  });
  describe('equipVehicle', () => {
    it('equips a bike', () => {
      expect(newPlayer.vehicle).toBeUndefined();
      testArea.equipVehicle(newPlayer, 'bike');
      expect(newPlayer.vehicle).not.toBeUndefined();
      expect(newPlayer.vehicle?.toVehicleModel()).toEqual({
        speedMultiplier: 2,
        vehicleType: 'bike',
      });
    });
    it('equips a skateboard', () => {
      expect(newPlayer.vehicle).toBeUndefined();
      testArea.equipVehicle(newPlayer, 'skateboard');
      expect(newPlayer.vehicle).not.toBeUndefined();
      expect(newPlayer.vehicle?.toVehicleModel()).toEqual({
        speedMultiplier: 1.5,
        vehicleType: 'skateboard',
      });
    });
    it('equips a horse', () => {
      expect(newPlayer.vehicle).toBeUndefined();
      testArea.equipVehicle(newPlayer, 'horse');
      expect(newPlayer.vehicle).not.toBeUndefined();
      expect(newPlayer.vehicle?.toVehicleModel()).toEqual({
        speedMultiplier: 3,
        vehicleType: 'horse',
      });
    });
  });
  describe('unEquipVehicle', () => {
    beforeEach(() => {
      newPlayer.equipVehicle('bike');
    });
    it('unequips the current vehicle', () => {
      expect(newPlayer.vehicle).not.toBeUndefined();
      testArea.unequipVehicle(newPlayer);
      expect(newPlayer.vehicle).toBeUndefined();
    });
    it('does not throw error if you already have no vehicle', () => {
      expect(newPlayer.vehicle).not.toBeUndefined();
      testArea.unequipVehicle(newPlayer);
      expect(newPlayer.vehicle).toBeUndefined();
      testArea.unequipVehicle(newPlayer);
      expect(newPlayer.vehicle).toBeUndefined();
    });
  });
  test('toModel sets the ID and occupants', () => {
    const model = testArea.toModel();
    expect(model).toEqual({
      id,
      occupants: [newPlayer.id],
      type: 'VehicleRackArea',
    });
  });
  describe('fromMapObject', () => {
    it('Throws an error if the width or height are missing', () => {
      expect(() =>
        VehicleRackArea.fromMapObject(
          { id: 1, name: nanoid(), visible: true, x: 0, y: 0 },
          townEmitter,
        ),
      ).toThrowError();
    });
    it('Creates a new vehicle rack area using the provided boundingBox, id, and emitter', () => {
      const x = 30;
      const y = 20;
      const width = 10;
      const height = 20;
      const name = 'name';
      const val = VehicleRackArea.fromMapObject(
        { x, y, width, height, name, id: 10, visible: true },
        townEmitter,
      );
      expect(val.boundingBox).toEqual({ x, y, width, height });
      expect(val.id).toEqual(name);
      expect(val.occupantsByID).toEqual([]);
    });
  });
});
