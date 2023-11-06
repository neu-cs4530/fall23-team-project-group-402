import { nanoid } from 'nanoid';
import {
  Player as PlayerModel,
  PlayerLocation,
  TownEmitter,
  VehicleType,
} from '../types/CoveyTownSocket';
import Vehicle from '../town/vehicles/Vehicle';
import BikeVehicle from '../town/vehicles/BikeVehicle';
import HorseVehicle from '../town/vehicles/HorseVehicle';
import SkateboardVehicle from '../town/vehicles/SkateboardVehicle';

/**
 * Each user who is connected to a town is represented by a Player object
 */
export default class Player {
  /** The current location of this user in the world map * */
  public location: PlayerLocation;

  /** The unique identifier for this player * */
  private readonly _id: string;

  /** The player's username, which is not guaranteed to be unique within the town * */
  private readonly _userName: string;

  /** The secret token that allows this client to access our Covey.Town service for this town * */
  private readonly _sessionToken: string;

  /** The secret token that allows this client to access our video resources for this town * */
  private _videoToken?: string;

  /** A special town emitter that will emit events to the entire town BUT NOT to this player */
  public readonly townEmitter: TownEmitter;

  private _vehicle: Vehicle | undefined;

  constructor(userName: string, townEmitter: TownEmitter) {
    this.location = {
      x: 0,
      y: 0,
      moving: false,
      rotation: 'front',
    };
    this._userName = userName;
    this._id = nanoid();
    this._sessionToken = nanoid();
    this.townEmitter = townEmitter;
    this._vehicle = undefined;
  }

  get userName(): string {
    return this._userName;
  }

  get id(): string {
    return this._id;
  }

  set videoToken(value: string | undefined) {
    this._videoToken = value;
  }

  get videoToken(): string | undefined {
    return this._videoToken;
  }

  get sessionToken(): string {
    return this._sessionToken;
  }

  get vehicle(): Vehicle | undefined {
    return this._vehicle;
  }

  public equipVehicle(type: VehicleType): void {
    if (type === 'bike') {
      this._vehicle = new BikeVehicle();
    } else if (type === 'horse') {
      this._vehicle = new HorseVehicle();
    } else if (type === 'skateboard') {
      this._vehicle = new SkateboardVehicle();
    }
  }

  public unEquipVehicle(): void {
    this._vehicle = undefined;
  }

  toPlayerModel(): PlayerModel {
    return {
      id: this._id,
      location: this.location,
      userName: this._userName,
      vehicle: this._vehicle?.toVehicleModel(),
    };
  }
}
