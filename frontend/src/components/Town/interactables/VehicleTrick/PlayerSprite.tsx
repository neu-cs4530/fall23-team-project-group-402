import React, { useEffect, useRef } from 'react';
import { Box } from '@chakra-ui/react';
import Phaser from 'phaser';

/**
 * Custom phaser scene needed to mount the player sprite component with a vehicle.
 */
class PhaserScene extends Phaser.Scene {
  private _vehicleType: string | undefined;

  private _player: Phaser.GameObjects.Sprite | undefined;

  constructor(vehicleType: string | undefined) {
    super({ key: 'PhaserScene' });
    this._vehicleType = vehicleType;
  }

  preload() {
    if (!this._vehicleType) return;
    this.load.atlas(
      `${this._vehicleType}-atlas`,
      `./assets/atlas/${this._vehicleType}-atlas.png`,
      `./assets/atlas/${this._vehicleType}-atlas.json`,
    );
  }

  createTrickAnimations(numTricks: number, numFrames: number) {
    if (!this._vehicleType) return;

    const { anims } = this;
    for (let i = 1; i <= numTricks; i++) {
      anims.create({
        key: `${this._vehicleType}-trick-${i}`,
        frames: anims.generateFrameNames(`${this._vehicleType}-atlas`, {
          prefix: `${this._vehicleType}-trick-${i}.`,
          start: 0,
          end: numFrames,
          zeroPad: 3,
        }),
        frameRate: 10,
        repeat: 0,
      });
    }
  }

  create() {
    if (!this._vehicleType) return;
    const player = this.add.sprite(
      88,
      50,
      `${this._vehicleType}-atlas`,
      `${
        this._vehicleType === 'skateboard'
          ? `${this._vehicleType}-front`
          : `${this._vehicleType}-right`
      }`,
    );
    player.setScale(1.9);

    if (this._vehicleType === 'bike') {
      this.createTrickAnimations(1, 10);
      player.setY(99);
    } else if (this._vehicleType === 'skateboard') {
      this.createTrickAnimations(3, 9);
      player.setY(99);
    } else if (this._vehicleType === 'horse') {
      this.createTrickAnimations(1, 10);
      player.setY(78);
    }

    this._player = player;
  }

  /**
   * Plays a random trick animation depending on what vehicle the player
   * has equipped.
   */
  playAnimation(): void {
    if (this._player && this._vehicleType) {
      const trickNumber: number =
        this._vehicleType === 'skateboard' ? Math.floor(Math.random() * 3) + 1 : 1;
      this._player.anims.play(`${this._vehicleType}-trick-${trickNumber}`, false);
    }
  }
}

type PlayerSpriteProps = {
  vehicleType: string | undefined;
  targetWord: string;
};

/** Component to show the player sprite doing trick animations on their vehicle. */
export default function PlayerSprite({ vehicleType, targetWord }: PlayerSpriteProps): JSX.Element {
  const sceneRef = useRef<PhaserScene | undefined>(undefined);

  useEffect(() => {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 400,
      height: 400,
      scene: PhaserScene,
      parent: 'phaser-container',
      transparent: true,
    };

    const phaserGame = new Phaser.Game(config);
    const newScene = new PhaserScene(vehicleType);
    phaserGame.scene.add('sprite', newScene, true);
    sceneRef.current = newScene;

    return () => {
      phaserGame.destroy(true);
    };
  }, [vehicleType]);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.playAnimation();
    }
  }, [targetWord]);

  return (
    <Box
      as='span'
      flex='1'
      textAlign='left'
      width='200px'
      maxHeight='160px'
      mt={-45}
      borderColor={'red'}
      borderWidth={0}
      overflow='hidden'>
      <div id='phaser-container' style={{ width: '100%', height: '100%' }} />
    </Box>
  );
}
