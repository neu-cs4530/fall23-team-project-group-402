import { ITiledMapObject } from '@jonbell/tiled-map-type-guard';
import InvalidParametersError from '../lib/InvalidParametersError';
import {
  BoundingBox,
  InteractableCommand,
  InteractableCommandReturnType,
  InteractableID,
  TownEmitter,
  VehicleRackArea as VehicleRackAreaModel,
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
   * Creates a new VehicleRackArea object that will represent a Vehicle Rack Area object in the town map.
   * @returns VehicleRackAreaModel object representing a Vehicle Rack Area object
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

  public handleCommand<
    CommandType extends InteractableCommand,
  >(): InteractableCommandReturnType<CommandType> {
    throw new InvalidParametersError('Unknown command type');
  }
}
