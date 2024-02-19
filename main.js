import './style.css'
import Phaser from 'phaser'

const sizes={
  width:1200,
  height:900
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
    this.load.audio('explosionSound', 'assets/sounds/explosion.wav');
    this.load.audio('shootSound', 'assets/sounds/lasershoot1.ogg');
    this.load.image("healthPack", "/assets/healthpack.png");
    this.load.audio('healSound', 'assets/sounds/heal.mp3');
    this.load.audio('backgroundMusic', 'assets/sounds/backgroundmusic.mp3');
    this.load.image("shuttle2", "/assets/shuttle2.png")





  }


  create(){
    this.backgroundMusic = this.sound.add('backgroundMusic', { volume: 0.5, loop: true });
    this.backgroundMusic.play();   
    // Listen for the shutdown event
    this.events.on('shutdown', () => {
      if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
          this.backgroundMusic.stop();
      }
  });

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

    
    this.player2 = this.physics.add.image(850, 450, 'shuttle2'); // Adjust position for player 2
    this.player2.setOrigin(0.5, 0.5);
    this.player2.setCollideWorldBounds(true);
    this.player2.body.setSize(newWidth, newHeight, false);
    this.player2.setRotation(-Math.PI / 2);
    // You may want to adjust the size or the physics properties as you did with the first player
    // Rotate the sprite to face upwards initially
    this.keys2 = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      shoot: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F) // Assuming F is for shooting
    };
   


    // Correct placement: Initialize healthBar Graphics object before updating it
    this.healthBar = this.add.graphics();

    //reset player health and update the health bar
    this.playerHealth = 100;
    this.updateHealthBar(); 

    this.player2Health = 100; // Starting health for player2
    this.healthBarPlayer2 = this.add.graphics();
    this.updateHealthBarPlayer2();

    // If you need to adjust the physics body's offset
    const offsetX = 0; // Adjust as necessary
    const offsetY = 0; // Adjust as necessary
    this.player.body.setOffset(offsetX, offsetY);


    // For Player 1's HP Label
    this.labelPlayer1HP = this.add.text(this.cameras.main.width - 220, 2, "Player 1's HP", { fontSize: '16px', fill: '#FFFFFF' });

    // For Player 2's HP Label, placed below Player 1's health bar
    this.labelPlayer2HP = this.add.text(this.cameras.main.width - 220, 31, "Player 2's HP", { fontSize: '16px', fill: '#FFFFFF' });

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

    this.physics.add.collider(this.player2, this.asteroids, (player2, asteroid) => {
      this.takeDamagePlayer2(20); // Assuming you implement a method to handle damage to player2
      asteroid.destroy(); // Destroy the asteroid or handle it as needed
  });

  // Shoot with spacebar
  this.shootKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // After creating bullets and asteroids
    this.physics.add.collider(this.bullets, this.asteroids, (bullet, asteroid) => {
      bullet.destroy(); // Correctly destroy the bullet
      asteroid.destroy(); // Correctly destroy the asteroid
      this.score += 1; // Increment the score
      this.scoreText.setText('Score: ' + this.score); // Update the score display
        // Play the explosion sound effect
      this.sound.play('explosionSound');
  });

    // Create a group for health packs
    this.healthPacks = this.physics.add.group();

    // Setup collision detection for the group
    this.physics.add.overlap(this.player, this.healthPacks, (player, healthPack) => {
      this.healPlayer(20); // Adjust the amount as needed
      healthPack.destroy(); // Remove the health pack after pickup
      // Play the healing sound effect
      this.sound.play('healSound');
   });

   this.physics.add.overlap(this.player2, this.healthPacks, (player2, healthPack) => {
    this.healPlayer2(20); // Implement this method to handle healing player2
    healthPack.destroy(); // Remove the health pack from the game
    this.sound.play('healSound');
    
  });

    this.time.addEvent({
      delay: 10000, // 10000 milliseconds = 10 seconds
      callback: this.createHealthPack,
      callbackScope: this,
      loop: true
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
  this.shootBullet(this.player); // Pass this.player as the argument
}


// Player 2 rotation and movement
if (this.keys2.left.isDown) {
  this.player2.setAngularVelocity(-250);
} else if (this.keys2.right.isDown) {
  this.player2.setAngularVelocity(250);
} else {
  this.player2.setAngularVelocity(0);
}

if (this.keys2.up.isDown) {
  this.physics.velocityFromRotation(this.player2.rotation, this.playerSpeed, this.player2.body.velocity);
} else if (this.keys2.down.isDown) {
  this.physics.velocityFromRotation(this.player2.rotation, -this.playerSpeed / 2, this.player2.body.velocity);
} else {
  if (!this.keys2.left.isDown && !this.keys2.right.isDown) {
      this.player2.setVelocity(0);
  }
}

// Shooting for player 2
if (Phaser.Input.Keyboard.JustDown(this.keys2.shoot)) {
  this.shootBullet(this.player2);
}


}

healPlayer(amount) {
  this.playerHealth += amount;
  this.playerHealth = Phaser.Math.Clamp(this.playerHealth, 0, 100); // Ensure health doesn't exceed 100
  this.updateHealthBar(); // Assuming you have a method to update the health bar
}

healPlayer2(amount) {
  this.player2Health += amount;
  this.player2Health = Phaser.Math.Clamp(this.player2Health, 0, 100); // Ensure health doesn't exceed 100
  this.updateHealthBarPlayer2(); // Update the health bar for player2
}

createHealthPack() {
  const x = Phaser.Math.Between(0, this.sys.game.config.width);
  const y = Phaser.Math.Between(0, this.sys.game.config.height);
  const healthPack = this.healthPacks.create(x, y, 'healthPack');

  healthPack.setInteractive();
  healthPack.body.setAllowGravity(false); // If needed
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

updateHealthBarPlayer2() {
  this.healthBarPlayer2.clear();

  // Assuming the health bars are in the top right corner of the screen
  // and considering the game's width to position player1's health bar
  const baseX = this.cameras.main.width - 220; // Position based on the screen width
  const baseY = 20; // Y position starting point for health bars at the top of the screen
  const spacing = 10; // Vertical spacing between health bars
  const healthBarHeight = 16; // The height of the health bar

  // Calculate Y position for player2's health bar to be below player1's
  const player2HealthBarY = baseY + healthBarHeight + spacing;

  // Draw the background for player2's health bar
  this.healthBarPlayer2.fillStyle(0x000000); // Black color for the background
  this.healthBarPlayer2.fillRect(baseX, player2HealthBarY, 200, healthBarHeight);

  // Draw the health fill for player2's health bar
  this.healthBarPlayer2.fillStyle(0x00ff00); // Green color for the health
  const fillWidth = Phaser.Math.Clamp(this.player2Health, 0, 100) * 2; // Convert health to fill width
  this.healthBarPlayer2.fillRect(baseX, player2HealthBarY, fillWidth, healthBarHeight);
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

takeDamagePlayer2(amount) {
  this.player2Health -= amount;
  this.player2Health = Phaser.Math.Clamp(this.player2Health, 0, 100); // Clamp the health value to ensure it stays within bounds
  this.updateHealthBarPlayer2(); // Update player2's health bar

  if (this.player2Health <= 0) {
      // Handle player2's defeat (e.g., end game, respawn, etc.)
      console.log("Player 2 has been defeated!");
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

shootBullet(player) {
  const angle = player.rotation; // Use the passed player's rotation
  const startPosition = this.getMissileStartPosition(player.x, player.y, angle, player.displayWidth / 2);
  let missile = this.bullets.create(startPosition.x, startPosition.y, 'missile');
  if (missile) {
      missile.setActive(true).setVisible(true);
      this.physics.velocityFromRotation(angle, 400, missile.body.velocity);
      missile.rotation = angle;
      this.sound.play('shootSound');
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