import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';
import {
  Player as PlayerModel,
  PlayerLocation,
  Vehicle,
  VehicleType,
} from '../types/CoveyTownSocket';
import HorseVehicle from '../../../townService/src/town/vehicles/HorseVehicle';
import BikeVehicle from '../../../townService/src/town/vehicles/BikeVehicle';
import SkateboardVehicle from '../../../townService/src/town/vehicles/SkateboardVehicle';
import SpeedUtils from './SpeedUtils';

export type PlayerEvents = {
  movement: (newLocation: PlayerLocation) => void;
};

export type PlayerGameObjects = {
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  label: Phaser.GameObjects.Text;
  locationManagedByGameScene: boolean /* For the local player, the game scene will calculate the current location, and we should NOT apply updates when we receive events */;
  // vehicleSprite: SomeType TODO: add vehicle sprite here once we get to that
};
export default class PlayerController extends (EventEmitter as new () => TypedEmitter<PlayerEvents>) {
  private _location: PlayerLocation;

  private readonly _id: string;

  private readonly _userName: string;

  private _vehicle: Vehicle | undefined;

  public gameObjects?: PlayerGameObjects;

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

  toPlayerModel(): PlayerModel {
    return { id: this.id, userName: this.userName, location: this.location, vehicle: this.vehicle };
  }

  private _updateGameComponentLocation() {
    if (this.gameObjects && !this.gameObjects.locationManagedByGameScene) {
      const { sprite, label } = this.gameObjects;
      if (!sprite.anims) return;
      sprite.setX(this.location.x);
      sprite.setY(this.location.y);
      if (this.location.moving) {
        const movementSpeed = SpeedUtils.playerSpeed(this.vehicle);

        sprite.anims.play(`misa-${this.location.rotation}-walk`, true);
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
            break;
        }
        sprite.body.velocity.normalize().scale(175);
      } else {
        sprite.body.setVelocity(0, 0);
        sprite.anims.stop();
        sprite.setTexture('atlas', `misa-${this.location.rotation}`);
      }
      label.setX(sprite.body.x);
      label.setY(sprite.body.y - 20);
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
