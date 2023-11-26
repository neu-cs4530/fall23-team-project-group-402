import React, { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import Phaser from 'phaser';

class PhaserGame extends Phaser.Scene {
  vehicleType: string | undefined;

  player: Phaser.GameObjects.Sprite | undefined;

  constructor(vehicleType: string | undefined) {
    super({ key: 'PhaserGame' });
    this.vehicleType = vehicleType;
    // this.player = undefined;
  }

  preload() {
    if (this.vehicleType) {
      this.load.atlas(
        `${this.vehicleType}-atlas`,
        `./assets/atlas/${this.vehicleType}-atlas.png`,
        `./assets/atlas/${this.vehicleType}-atlas.json`,
      );
    }
  }

  createTrickAnimations(numTricks: number, numFrames: number) {
    const { anims } = this;
    for (let i = 1; i <= numTricks; i++) {
      anims.create({
        key: `${this.vehicleType}-trick-${i}`,
        frames: anims.generateFrameNames(`${this.vehicleType}-atlas`, {
          prefix: `${this.vehicleType}-trick-${i}.`,
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
    const player = this.add.sprite(88, 50, `${this.vehicleType}-atlas`);
    player.setScale(1.9);
    if (this.vehicleType === 'bike') {
      this.createTrickAnimations(1, 10);
      player.setY(99);
    } else if (this.vehicleType === 'skateboard') {
      this.createTrickAnimations(3, 9);
      player.setY(99);
    } else if (this.vehicleType === 'horse') {
      this.createTrickAnimations(1, 10);
      player.setY(78);
    }
    player.anims.play(`${this.vehicleType}-trick-1`, true);

    this.player = player;
  }

  update(): void {
    // this
    // if (this.player) {
    //   this.player.anims.play(`${this.vehicleType}-trick-1`, true);
    // }
  }

  playAnimation(): void {
    if (this.player && this.vehicleType) {
      const trickNumber: number =
        this.vehicleType === 'skateboard' ? Math.floor(Math.random() * 3) + 1 : 1;
      this.player.anims.play(`${this.vehicleType}-trick-${trickNumber}`, true);
    }
  }

  /*
  const player = this._player;
    if (player && player.gameObjects) {
      const { sprite } = player.gameObjects;
      const vehicleType: VehicleType | undefined = player.vehicle?.vehicleType;
      const trickNumber: number =
        vehicleType === 'skateboard' ? Math.floor(Math.random() * 3) + 1 : 1;
      sprite.anims.play(`${vehicleType}-trick-${trickNumber}`, true);
    }

  */
}

// export default function PlayerSprite({
//   vehicleType: string | undefined;
//   updateScore: (score: number) => void;
//   targetWord: string;
// }: { vehicleType, updateScore, targetWord }): JSX.Element {
// }

type SpriteProps = {
  vehicleType: string | undefined;
  targetWord: string;
};

export default function PlayerSprite({ vehicleType, targetWord }: SpriteProps): JSX.Element {
  const [game, setGame] = useState<PhaserGame | undefined>(undefined);

  useEffect(() => {
    // Phaser game initialization
    console.log('creating game');
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 400,
      height: 400,
      scene: PhaserGame,
      parent: 'phaser-container',
      transparent: true, // Set the parent container ID
    };

    const phaserGame = new Phaser.Game(config);
    const newGameScene = new PhaserGame(vehicleType);
    phaserGame.scene.add('sprite', newGameScene, true);
    setGame(newGameScene);

    // Cleanup Phaser game on component unmount
    return () => {
      if (game) {
        phaserGame.destroy(true);
      }
    };
  }, [vehicleType]);

  useEffect(() => {
    if (game) {
      game.playAnimation();
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
