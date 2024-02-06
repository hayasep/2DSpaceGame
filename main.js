import './style.css'
import Phaser from 'phaser'

const sizes={
  width:800,
  height:600
}

const speedDown = 300

class MainMenuScene extends Phaser.Scene {
  constructor() {
      super({ key: 'MainMenuScene' });
  }

  create() {
      // Add menu text
      let titleText = this.add.text(this.cameras.main.centerX, 150, 'HTML 5 Multiplayer 2D Space Arcade Game', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
      let startGameText = this.add.text(this.cameras.main.centerX, 250, 'Start Game', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);

      // Make the 'Start Game' text clickable
      startGameText.setInteractive({ useHandCursor: true });
      startGameText.on('pointerdown', () => {
          this.scene.start('GameScene');
      });
  }
}


class GameScene extends Phaser.Scene{
  constructor(){
    super("GameScene")
    this.player
    this.cursor
    this.playerSpeed=speedDown+50
    this.score = 0; // Initialize score
    this.scoreText; // For displaying the score
    this.playerHealth = 100; // Starting health
  }

  preload(){
    this.load.image("bg", "/assets/spacebg_resized.jpg")
    this.load.image("shuttle", "/assets/shuttle.png")
    this.load.image("asteroid", "/assets/asteroid.png");
    this.load.image("missile", "/assets/missile.png");
  }


  create(){
    

    this.add.image(0,0,"bg").setOrigin(0,0);
    // Create the player sprite
    this.player = this.physics.add.image(250, 450, 'shuttle');

    // Set the origin to the center of the sprite
    this.player.setOrigin(0.4, 0.5);
    // Enable collision with the world bounds
    this.player.setCollideWorldBounds(true);

    // Rotate the sprite to face upwards initially
    this.player.setRotation(-Math.PI / 2);

    // Adjust player dimensions
    const newWidth = 40; //  width, adjust based on your sprite's dimensions
    const newHeight = 55; //  height, adjust based on your sprite's dimensions
    this.player.body.setSize(newWidth, newHeight, false);

    // Correct placement: Initialize healthBar Graphics object before updating it
    this.healthBar = this.add.graphics();

    //reset player health and update the health bar
    this.playerHealth = 100;
    this.updateHealthBar(); // This should now work without causing a blank screen

    // If you need to adjust the physics body's offset
    const offsetX = 0; // Adjust as necessary
    const offsetY = 0; // Adjust as necessary
    this.player.body.setOffset(offsetX, offsetY);

    // Display the score
    this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#FFF' });


    // Listen for the Escape key to return to the main menu
    this.input.keyboard.on('keydown-ESC', () => {
    this.scene.start('MainMenuScene');
    });

    this.cursor=this.input.keyboard.createCursorKeys()

    this.createAsteroids();

    this.bullets = this.physics.add.group({
      defaultKey: 'missile',
  });

  // Schedule asteroids to spawn every 1 second
    this.time.addEvent({
    delay: 1000,
    callback: this.createAsteroid,
    callbackScope: this,
    loop: true
    });

    this.physics.add.collider(this.player, this.asteroids, (player, asteroid) => {
      this.takeDamage(20);
      asteroid.destroy(); // Optionally destroy the asteroid or handle it differently
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

  
update() {
  this.player.setAngularVelocity(0); // Stop any rotation by default

  // Rotation
  if (this.cursor.left.isDown) {
      this.player.setAngularVelocity(-250); // Rotate left
  } else if (this.cursor.right.isDown) {
      this.player.setAngularVelocity(250); // Rotate right
  }

  // Forward movement
  if (this.cursor.up.isDown) {
      this.physics.velocityFromRotation(this.player.rotation, this.playerSpeed, this.player.body.velocity);
  } else if (this.cursor.down.isDown) {
      // Optional: Implement backward movement if desired
      this.physics.velocityFromRotation(this.player.rotation, -this.playerSpeed / 2, this.player.body.velocity);
  } else {
      if (!this.cursor.left.isDown && !this.cursor.right.isDown) {
          this.player.setVelocity(0); // Stop moving when no input is detected
      }
  }

  // Shooting
  if (Phaser.Input.Keyboard.JustDown(this.shootKey)) {
      this.shootBullet();
  }
}



updateHealthBar() {
  this.healthBar.clear(); // Clear the old drawing
  this.healthBar.fillStyle(0x00ff00, 1); // Set the color of the health bar

  // Calculate the width of the health bar based on the player's current health
  const healthPercentage = this.playerHealth / 100;
  const healthBarWidth = 200 * healthPercentage; // 200 is the max width of the health bar

  // Draw the health bar
  this.healthBar.fillRect(this.cameras.main.width - 220, 16, healthBarWidth, 16);
}

takeDamage(amount) {
  this.playerHealth -= amount;
  this.playerHealth = Math.max(0, this.playerHealth);
  this.updateHealthBar();

  if (this.playerHealth <= 0) {
      console.log("Player has died");
      this.physics.pause(); // Stop physics but keep the scene active for input

      // Display "Game Over" text
      this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 100, 'Game Over', { fontSize: '64px', fill: '#ff0000' }).setOrigin(0.5);

      // Add "Back to Main Menu" text
      let backToMenuText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'Back to Main Menu', { fontSize: '32px', fill: '#ffffff' }).setOrigin(0.5);

      // Make "Back to Main Menu" interactive
      backToMenuText.setInteractive({ useHandCursor: true });
      backToMenuText.on('pointerdown', () => {
          this.scene.stop('GameScene'); // Optionally clear the current game scene
          this.scene.start('MainMenuScene'); // Go back to the MainMenuScene
      });
  }
}

createAsteroid() {
  const x = Phaser.Math.Between(0, this.sys.game.config.width);
  const y = -50;
  // Ensure the asteroid is added to the 'asteroids' group
  const asteroid = this.asteroids.create(x, y, 'asteroid');
  if (asteroid) {
      asteroid.setVelocity(Phaser.Math.Between(-50, 50), Phaser.Math.Between(50, 150));
      asteroid.setCollideWorldBounds(true);
      asteroid.setBounce(1, 1);
  }
}

createAsteroids() {
  this.asteroids = this.physics.add.group();
  for (let i = 0; i < 5; i++) {
      this.createAsteroid();
  }
}

shootBullet() {
  
  const angle = this.player.rotation; // Current rotation of the player in radians

  // Calculate the missile's starting position
  // Note: You might need to adjust the offset based on the sprite's dimensions and desired launch position
  const startPosition = this.getMissileStartPosition(this.player.x, this.player.y, angle, this.player.displayWidth / 2);

  // Create or reuse a missile
  let missile = this.bullets.create(startPosition.x, startPosition.y, 'missile');
  if (missile) {
      missile.setActive(true).setVisible(true);
      
      // Set missile to move in the direction the player is facing
      this.physics.velocityFromRotation(angle, 400, missile.body.velocity); // 400 is the missile speed, adjust as needed
      missile.rotation = angle; // Align missile's direction with player's current rotation

      
  }
}

getMissileStartPosition(x, y, rotation, offset) {
  // Calculate the missile's starting position based on player's position, rotation, and an offset
  // This offset moves the missile to the front of the player sprite
  const point = new Phaser.Geom.Point(x + offset * Math.cos(rotation), y + offset * Math.sin(rotation));
  return point;
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
      debug:false
    }
  },
  scene:[MainMenuScene, GameScene]
}

const game = new Phaser.Game(config)