import React, { useEffect } from 'react';
import { ChakraProvider, Box, extendTheme } from '@chakra-ui/react';
import Phaser from 'phaser';

const theme = extendTheme({
  // Your Chakra UI theme configuration
});

class PhaserGame extends Phaser.Scene {
  constructor() {
    super({ key: 'PhaserGame' });
  }

  preload() {
    // Load your sprite and animation
    this.load.atlas(
      'bike-atlas',
      './assets/atlas/bike-atlas.png',
      './assets/atlas/bike-atlas.json',
    );
  }

  create() {
    console.log('Create method called');
    const player = this.add.sprite(200, 200, 'bike-atlas');
    console.log('Sprite created:', player);
    const { anims } = this;
    anims.create({
      key: `walk`,
      frames: anims.generateFrameNames(`bike-atlas`, {
        prefix: `bike-trick-1.`,
        start: 0,
        end: 10,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: 0,
    });
    console.log('Animation created');
    player.anims.play('walk', true);
    console.log('Animation played');
  }

  update() {
    // Update logic
  }
}

const PlayerSprite: React.FC = () => {
  useEffect(() => {
    // Phaser game initialization
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 400,
      height: 400,
      scene: PhaserGame,
    };

    const game = new Phaser.Game(config);

    // Cleanup Phaser game on component unmount
    return () => {
      game.destroy(true);
    };
  }, []); // Empty dependency array to run the effect only once on mount

  return (
    <ChakraProvider theme={theme}>
      <Box
        as='span'
        flex='1'
        textAlign='left'
        position='relative'
        width='400px' // Adjust the width and height based on your game dimensions
        height='400px'>
        {/* Phaser game container */}
        <div id='phaser-container' />
      </Box>
    </ChakraProvider>
  );
};

export default PlayerSprite;
