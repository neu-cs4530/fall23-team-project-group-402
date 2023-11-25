import React, { useEffect } from 'react';
import { Box } from '@chakra-ui/react';
import Phaser from 'phaser';

class PhaserGame extends Phaser.Scene {
  vehicleType: string | undefined;

  player: Phaser.GameObjects.Sprite | undefined;

  constructor(vehicleType: string | undefined) {
    super({ key: 'PhaserGame' });
    this.vehicleType = vehicleType;
    this.player = undefined;
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
    // if (this.player) {
    //   this.player.anims.play(`${this.vehicleType}-trick-1`, true);
    // }
  }
}

const PlayerSprite: React.FC<{ vehicleType: string | undefined }> = ({ vehicleType }) => {
  useEffect(() => {
    // Phaser game initialization
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 400,
      height: 400,
      scene: PhaserGame,
      parent: 'phaser-container',
      transparent: true, // Set the parent container ID
    };

    const game = new Phaser.Game(config);
    const newGameScene = new PhaserGame(vehicleType);
    game.scene.add('sprite', newGameScene, true);

    // Cleanup Phaser game on component unmount
    return () => {
      game.destroy(true);
    };
  }); // Empty dependency array to run the effect only once on mount

  return (
    <Box
      as='span'
      flex='1'
      textAlign='left'
      width='200px' // Adjust the width and height based on your game dimensions
      maxHeight='160px'
      mt={-45}
      borderColor={'red'}
      borderWidth={0}
      overflow='hidden' // Ensure the game container stays within the box
    >
      {/* Phaser game container */}
      <div id='phaser-container' style={{ width: '100%', height: '100%' }} />
    </Box>
  );
};

export default PlayerSprite;
