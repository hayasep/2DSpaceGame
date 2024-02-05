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
    this.score = 0; // Initialize score
    this.scoreText; // For displaying the score
  }

  preload(){
    this.load.image("bg", "/assets/extended_spacebg_vertical.jpg")
    this.load.image("shuttle", "/assets/shuttle.png")
    this.load.image("asteroid", "/assets/asteroid.png");
    this.load.image("missile", "/assets/missile.png");
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

    // Display the score
    this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#FFF' });


    this.cursor=this.input.keyboard.createCursorKeys()

    this.createAsteroids();

    this.bullets = this.physics.add.group({
      defaultKey: 'missile',
  });

  // Shoot with spacebar
  this.shootKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // After creating bullets and asteroids
  this.physics.add.collider(this.bullets, this.asteroids, (bullet, asteroid) => {
    bullet.destroy(); // Correctly destroy the bullet
    asteroid.destroy(); // Correctly destroy the asteroid
    this.score += 1; // Increment the score
    this.scoreText.setText('Score: ' + this.score); // Update the score display
  });
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
      // Shooting
      if (Phaser.Input.Keyboard.JustDown(this.shootKey)) {
        this.shootBullet();
    } 
    
  }
  shootBullet() {
    // Create or reuse a missile instead of a generic bullet
    let missile = this.bullets.create(this.player.x + this.player.width / 2 - 10, this.player.y, 'missile');
    if (missile) {
        missile.setActive(true).setVisible(true).setVelocityY(-300);

        // Adjust size, velocity, or other properties as needed
        missile.setScale(0.5); // Example: Scale down if the sprite is too large

        // Automatically destroy the missile when it goes out of bounds
        missile.setCollideWorldBounds(true);
        missile.body.onWorldBounds = true; // Enable world bounds event
        this.physics.world.on('worldbounds', (body) => {
            // Check if the body's gameObject is the missile
            if (body.gameObject === missile) {
                missile.destroy();
            }
        });
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