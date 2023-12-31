import assert from 'assert';
import { mock, mockClear } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import { VehicleType } from '../../types/CoveyTownSocket';
import PlayerController from '../PlayerController';
import TownController from '../TownController';
import VehicleRackAreaController, { VehicleRackAreaEvents } from './VehicleRackAreaController';

describe('VehicleRackAreaController', () => {
  const mockListeners = mock<VehicleRackAreaEvents>();
  const ourPlayer = new PlayerController(
    nanoid(),
    nanoid(),
    {
      x: 0,
      y: 0,
      moving: false,
      rotation: 'front',
    },
    undefined,
  );
  const otherPlayers = [
    new PlayerController(
      nanoid(),
      nanoid(),
      { x: 0, y: 0, moving: false, rotation: 'front' },
      undefined,
    ),
    new PlayerController(
      nanoid(),
      nanoid(),
      { x: 0, y: 0, moving: false, rotation: 'front' },
      undefined,
    ),
  ];

  const mockTownController = mock<TownController>();
  Object.defineProperty(mockTownController, 'ourPlayer', {
    get: () => ourPlayer,
  });
  Object.defineProperty(mockTownController, 'players', {
    get: () => [ourPlayer, ...otherPlayers],
  });
  mockTownController.getPlayer.mockImplementation(playerID => {
    const p = mockTownController.players.find(player => player.id === playerID);
    assert(p);
    return p;
  });
  const testArea = new VehicleRackAreaController(nanoid(), mockTownController);

  beforeEach(() => {
    mockClear(mockTownController);
    mockClear(mockListeners.vehicleChange);
    mockClear(mockListeners.occupantsChange);
    testArea.addListener('occupantsChange', mockListeners.occupantsChange);
  });
  describe('isActive', () => {
    it('Returns false if the occupants list is empty', () => {
      testArea.occupants = [];
      expect(testArea.isActive()).toBe(false);
    });
    it('Returns true if the occupants list is not empty', () => {
      testArea.occupants = mockTownController.players;
      expect(testArea.isActive()).toBe(true);
    });
  });
  describe('set Vehicle', () => {
    it('does not send a vehicleChange if the vehicle is the same type', () => {
      const vehicleCopy = `${testArea.vehicle}`;
      testArea.vehicle = vehicleCopy as VehicleType;
      expect(mockListeners.vehicleChange).not.toBeCalled();
    });
    it('sets the vehicle to be a bike', () => {
      const newVehicle = 'bike';
      testArea.vehicle = newVehicle;
      expect(testArea.vehicle).toEqual(newVehicle);
      expect(testArea.toInteractableAreaModel()).toEqual({
        id: testArea.id,
        occupants: testArea.occupants.map(eachOccupant => eachOccupant.id),
        type: 'VehicleRackArea',
      });
    });
    it('sets the vehicle to be a horse', () => {
      const newVehicle = 'horse';
      testArea.vehicle = newVehicle;
      expect(testArea.vehicle).toEqual(newVehicle);
      expect(testArea.toInteractableAreaModel()).toEqual({
        id: testArea.id,
        occupants: testArea.occupants.map(eachOccupant => eachOccupant.id),
        type: 'VehicleRackArea',
      });
    });
    it('sets the vehicle to be a skateboard', () => {
      const newVehicle = 'skateboard';
      testArea.vehicle = newVehicle;
      expect(testArea.vehicle).toEqual(newVehicle);
      expect(testArea.toInteractableAreaModel()).toEqual({
        id: testArea.id,
        occupants: testArea.occupants.map(eachOccupant => eachOccupant.id),
        type: 'VehicleRackArea',
      });
    });
  });
  describe('equipVehicle', () => {
    it('equips skateboard to our player', () => {
      const newVehicle = 'skateboard';
      testArea.vehicle = newVehicle;
      expect(testArea.equipVehicle()).toEqual({
        speedMultiplier: 1.5,
        vehicleType: 'skateboard',
      });
    });
    it('equips bike to our player', () => {
      const newVehicle = 'bike';
      testArea.vehicle = newVehicle;
      testArea.equipVehicle();
      expect(mockTownController.ourPlayer.vehicle).toEqual({
        speedMultiplier: 2,
        vehicleType: 'bike',
      });
    });
    it('equips horse to our player', () => {
      const newVehicle = 'horse';
      testArea.vehicle = newVehicle;
      testArea.equipVehicle();
      expect(mockTownController.ourPlayer.vehicle).toEqual({
        speedMultiplier: 3,
        vehicleType: 'horse',
      });
    });
    it('equips undefined vehicle to our player, (unequips)', () => {
      const newVehicle = undefined;
      testArea.vehicle = newVehicle;
      testArea.equipVehicle();
      expect(mockTownController.ourPlayer.vehicle).toEqual(undefined);
    });
  });
  describe('setting the occupants property', () => {
    it('does not update the property if the new occupants are the same set as the old', () => {
      const origOccupants = testArea.occupants;
      const occupantsCopy = testArea.occupants.concat([]);
      const shuffledOccupants = occupantsCopy.reverse();
      testArea.occupants = shuffledOccupants;
      expect(testArea.occupants).toEqual(origOccupants);
      expect(mockListeners.occupantsChange).not.toBeCalled();
    });
    it('emits the occupantsChange event when setting the property and updates the model', () => {
      const newOccupants = testArea.occupants.slice(1);
      testArea.occupants = newOccupants;
      expect(testArea.occupants).toEqual(newOccupants);
      expect(mockListeners.occupantsChange).toBeCalledWith(newOccupants);
      expect(testArea.toInteractableAreaModel()).toEqual({
        id: testArea.id,
        occupants: testArea.occupants.map(eachOccupant => eachOccupant.id),
        type: 'VehicleRackArea',
      });
    });
  });
});
