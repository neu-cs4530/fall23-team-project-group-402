import assert from 'assert';
import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';
import {
  Player as PlayerModel,
  PlayerLocation,
  Vehicle,
  VehicleType,
} from '../types/CoveyTownSocket';
import SpeedUtils from './SpeedUtils';

export type PlayerEvents = {
  movement: (newLocation: PlayerLocation) => void;
  vehicleChange: (newVehicle: Vehicle | undefined) => void;
};

export type PlayerGameObjects = {
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  label: Phaser.GameObjects.Text;
  locationManagedByGameScene: boolean /* For the local player, the game scene will calculate the current location, and we should NOT apply updates when we receive events */;
};
export default class PlayerController extends (EventEmitter as new () => TypedEmitter<PlayerEvents>) {
  private _location: PlayerLocation;

  private readonly _id: string;

  private readonly _userName: string;

  private _vehicle: Vehicle | undefined;

  public gameObjects?: PlayerGameObjects;

  public movementSpeed: number;

  constructor(
    id: string,
    userName: string,
    location: PlayerLocation,
    vehicle: Vehicle | undefined,
  ) {
    super();
    this._id = id;
    this._userName = userName;
    this._location = location;
    this._vehicle = vehicle;
    this.movementSpeed = SpeedUtils.playerSpeed(this.vehicle);
  }

  set location(newLocation: PlayerLocation) {
    this._location = newLocation;
    this._updateGameComponentLocation();
    this.emit('movement', newLocation);
  }

  get location(): PlayerLocation {
    return this._location;
  }

  get userName(): string {
    return this._userName;
  }

  get id(): string {
    return this._id;
  }

  set vehicle(vehicle: Vehicle | undefined) {
    this._vehicle = vehicle;
  }

  get vehicle(): Vehicle | undefined {
    return this._vehicle;
  }

  public equipVehicle(vehicleType: VehicleType | undefined): Vehicle | undefined {
    let speedMultiplier: number;
    switch (vehicleType) {
      case 'bike':
        speedMultiplier = 2;
        break;
      case 'skateboard':
        speedMultiplier = 1.5;
        break;
      case 'horse':
        speedMultiplier = 3;
        break;
      default:
        speedMultiplier = 1;
        break;
    }
    if (this._vehicle?.vehicleType !== vehicleType) {
      this.emit('vehicleChange', this._vehicle);
    }
    if (vehicleType) {
      this._vehicle = {
        speedMultiplier: speedMultiplier,
        vehicleType: vehicleType,
      };
    } else {
      this._vehicle = undefined;
    }
    return this._vehicle;
  }

  toPlayerModel(): PlayerModel {
    return { id: this.id, userName: this.userName, location: this.location, vehicle: this.vehicle };
  }

  private _updateGameComponentLocation() {
    if (this.gameObjects && !this.gameObjects.locationManagedByGameScene) {
      const { sprite, label } = this.gameObjects;
      if (!sprite.anims) return;
      sprite.setX(this.location.x);
      sprite.setY(this.location.y);
      const vehicleType = this.vehicle ? this.vehicle.vehicleType : 'walk';
      if (this.location.moving) {
        const movementSpeed = SpeedUtils.playerSpeed(this.vehicle);
        sprite.anims.play(`${vehicleType}-${this.location.rotation}-move`, true);
        switch (this.location.rotation) {
          case 'front':
            sprite.body.setVelocity(0, movementSpeed);
            break;
          case 'right':
            sprite.body.setVelocity(movementSpeed, 0);
            break;
          case 'back':
            sprite.body.setVelocity(0, -movementSpeed);
            break;
          case 'left':
            sprite.body.setVelocity(-movementSpeed, 0);
            console.log('left velocity', sprite.body.velocity);
            break;
        }
        sprite.body.velocity.normalize().scale(movementSpeed);
      } else {
        sprite.body.setVelocity(0, 0);
        sprite.anims.stop();
        sprite.setTexture(`${vehicleType}-atlas`, `${vehicleType}-${this.location.rotation}`);
      }
      const labelYOffset = this.vehicle ? 40 : 20;
      label.setX(sprite.body.x);
      label.setY(sprite.body.y - labelYOffset);
    }
  }

  static fromPlayerModel(modelPlayer: PlayerModel): PlayerController {
    return new PlayerController(
      modelPlayer.id,
      modelPlayer.userName,
      modelPlayer.location,
      modelPlayer.vehicle,
    );
  }
}
