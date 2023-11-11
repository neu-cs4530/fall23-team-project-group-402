import { ITiledMapObject } from '@jonbell/tiled-map-type-guard';
import InvalidParametersError from '../lib/InvalidParametersError';
import Player from '../lib/Player';
import {
  BoundingBox,
  InteractableCommand,
  InteractableCommandReturnType,
  InteractableID,
  TownEmitter,
  VehicleRackArea as VehicleRackAreaModel,
  EquipVehicleCommand,
  VehicleType,
} from '../types/CoveyTownSocket';
import InteractableArea from './InteractableArea';

export default class VehicleRackArea extends InteractableArea {
  /**
   * Creates a new VehicleRackArea
   *
   * @param vehicleRackArea model containing this area's starting state
   * @param coordinates the bounding box that defines this viewing area
   * @param townEmitter a broadcast emitter that can be used to emit updates to players
   */
  public constructor(
    { id }: Omit<VehicleRackAreaModel, 'type'>,
    coordinates: BoundingBox,
    townEmitter: TownEmitter,
  ) {
    super(id, coordinates, townEmitter);
  }

  /**
   * Equips given vehicle to given player.
   *
   * @param player - player to add the vehicle to
   * @param vehicle - vehicle to be added to player - Yet to be added.
   * @throws new InvalidParametersError if player is not in the game
   */
  public equipVehicle(player: Player, vehicle: VehicleType) {
    if (!player) {
      throw new Error('Invalid player');
    }
    player.equipVehicle(vehicle);
    this._emitAreaChanged();
  }

  /**
   * removes vehicle from given player
   *
   * @param player - player to remove vehicle from
   * @throws new InvalidParametersError if player is not in the game
   */
  public unequipVehicle(player: Player) {
    if (!player) {
      throw new Error('Invalid player');
    }
    player.unEquipVehicle();
    this._emitAreaChanged();
  }

  public handleCommand<CommandType extends InteractableCommand>(
    command: CommandType,
    player: Player,
  ): InteractableCommandReturnType<CommandType> {
    if (command.type === 'EquipVehicle') {
      const equipVehicle = command as EquipVehicleCommand;
      this.equipVehicle(player, equipVehicle.vehicle);
      return {} as InteractableCommandReturnType<CommandType>;
    }
    if (command.type === 'UnequipVehicle') {
      this.unequipVehicle(player);
    }

    throw new InvalidParametersError('Unknown command type');
  }

  /**
   * Creates a new VehicleRackArea object that will represent a Vehicle Rack Area object in the town map.
   * @param mapObject An ITiledMapObject that represents a rectangle in which this rack area exists
   * @param broadcastEmitter An emitter that can be used by this rack area to broadcast updates
   * @returns
   */
  public toModel(): VehicleRackAreaModel {
    return {
      id: this.id,
      occupants: this.occupantsByID,
      type: 'VehicleRackArea',
    };
  }

  public static fromMapObject(
    mapObject: ITiledMapObject,
    broadcastEmitter: TownEmitter,
  ): VehicleRackArea {
    const { name, width, height } = mapObject;
    if (!width || !height) {
      throw new Error(`Malformed viewing area ${name}`);
    }
    const rect: BoundingBox = { x: mapObject.x, y: mapObject.y, width, height };
    return new VehicleRackArea(
      { id: name as InteractableID, occupants: [] },
      rect,
      broadcastEmitter,
    );
  }
}
