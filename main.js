import './style.css'
import Phaser from 'phaser'

const sizes={
  width:500,
  height:500
}

const speedDown = 300

class GameScene extends Phaser.Scene{
  constructor(){
    super("scene-game")
    this.player
    this.cursor
    this.playerSpeed=speedDown+50

  }

  preload(){
    this.load.image("bg", "/assets/extended_spacebg_vertical.jpg")
    this.load.image("shuttle", "/assets/shuttle.png")
    this.load.image("asteroid", "/assets/asteroid.png");
  }

  createAsteroids() {
    this.asteroids = this.physics.add.group({
        key: 'asteroid',
        repeat: 5, // Number of asteroids
        setXY: { x: 12, y: 0, stepX: 70 } // Adjust position as needed
    });

    this.asteroids.children.iterate((asteroid) => {
        // Randomize velocity for floating effect
        const xVelocity = Phaser.Math.Between(-50, 50); // Horizontal velocity
        const yVelocity = Phaser.Math.Between(-50, 50); // Vertical velocity
        asteroid.setVelocity(xVelocity, yVelocity);
        asteroid.setCollideWorldBounds(true);
        asteroid.setBounce(1, 1); // Ensure they bounce off the world bounds
    });
}
  create(){
    this.add.image(0,0,"bg").setOrigin(0,0)
    this.player = this.physics.add.image(0,sizes.height-100,"shuttle").setOrigin(0,0)
    this.player.setImmovable(true)
    this.player.body.allowGravity = false
    this.player.setCollideWorldBounds(true)

    this.cursor=this.input.keyboard.createCursorKeys()

    this.createAsteroids();

    this.bullets = this.physics.add.group({
      defaultKey: 'bullet',
      maxSize: 10 // Limit the number of bullets on screen
  });

  // Shoot with spacebar
  this.shootKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }
  update(){
    const { left, right, up, down } = this.cursor;
    if (left.isDown) {
      this.player.setVelocityX(-this.playerSpeed);
    } else if (right.isDown) {
      this.player.setVelocityX(this.playerSpeed);
    } else if (up.isDown) {
      this.player.setVelocityY(-this.playerSpeed);
    } else if (down.isDown) {
      this.player.setVelocityY(this.playerSpeed);
    } else {
      this.player.setVelocity(0);
    }
  }
}

const config = {
  type:Phaser.WEBGL,
  width:sizes.width,
  height:sizes.height,
  canvas:gameCanvas,
  physics:{
    default:"arcade",
    arcade:{
      gravity:{y:0},
      debug:true
    }
  },
  scene:[GameScene]
}

const game = new Phaser.Game(config)