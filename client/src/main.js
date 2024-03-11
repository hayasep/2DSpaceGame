// import '../public/style.css'
import Phaser from 'phaser'
import io from 'socket.io-client';

const sizes={
  width:1200,
  height:900,
}

const speedDown = 300

const transportOptions = ['websocket', 'polling', 'flashsocket']; // Will get 'Access-Control-Allow-Origin' error if this is not included
// const socket = io('http://localhost:3000', {transports: transportOptions});

const newWidth = 40; //  width, adjust based on your sprite's dimensions
const newHeight = 55; //  height, adjust based on your sprite's dimensions
const offsetX = 0; // Adjust as necessary
const offsetY = 0; // Adjust as necessary



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
    this.playerHealth = 100; // Starting health
    this.opponentHealth = 100;
    this.targetScore = 100; // Points needed to win game

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
    var self = this;    

    // Connect to host
    this.socket = io('http://localhost:3000', {transports: transportOptions});
    
    // Create physics group for opponents
    this.opponents = this.physics.add.group()

    // Create asteroid group
    this.asteroids = this.physics.add.group();

    // Create bullets physics group
    this.bullets = this.physics.add.group({
      defaultKey: 'missile',
    });

    // Create a group for health packs
    this.healthPacks = this.physics.add.group();





    // Add a player when a connection to server is estabilshed. The socket id on the client side is checked against the socket id received on the server side 
    // to establish if the new player is the current user or an opponent.
    this.socket.on('currentPlayers', function (players) {
      Object.keys(players).forEach(function (id) {
        if (players[id].playerId === self.socket.id) {
          self.addPlayer(self,players[id])
        }
        else {
          self.addOpponents(self,players[id]);
        }
      });
    });
    this.socket.on('newPlayer', function (playerInfo) {
      self.addOpponents(self, playerInfo);
    });
    this.socket.on('disconnect', function (playerId) {
      self.opponents.getChildren().forEach(function (opponent) {
        if (playerId === opponent.playerId) {
          opponent.destroy();
        }
      });
    });

    // Update opponent position
    this.socket.on('playerMoved', function (playerInfo) {
      self.opponents.getChildren().forEach(function (opponent) {
        if (playerInfo.playerId === opponent.playerId) {
          opponent.setRotation(playerInfo.rotation);
          opponent.setPosition(playerInfo.x, playerInfo.y);
        }
      });
    });
  

    // Add background music
    this.backgroundMusic = this.sound.add('backgroundMusic', { volume: 0.5, loop: true });
    this.backgroundMusic.play();   

    // Listen for the shutdown event
    this.events.on('shutdown', () => {
      if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
          this.backgroundMusic.stop();
      }
  });

    // Add background
    this.add.image(0,0,"bg").setOrigin(0,0);


    // Display the score
    this.playerScoreText = this.add.text(16, 16, 'Your score: 0', { fontSize: '24px', fill: '#FFF' });
    this.opponentScoreText = this.add.text(16, 60, 'Opponent\'s score: 0', { fontSize: '24px', fill: '#FF0000' });
    this.targetScoreText = this.add.text(16, 105, 'Target score: ' + this.targetScore, { fontSize: '24px', fill: '#0000FF' });


    // Update the score when an asteroid is hit
    this.socket.on('updateScore', function (playerId, score){
      if (self.player.id === playerId) {
        self.playerScoreText.setText('Your score: ' + score);
        if (score >= 100) {
          self.socket.emit('gameOverScore', playerId)
        }
      }
      else {
        self.opponentScoreText.setText('Opponent\'s score: ' + score);
        if (score >= 100) {
          self.socket.emit('gameOverScore', playerId)
        }
      };
    });

    // Initialize player's HP Label
    this.playerHealthBar = this.add.graphics();
    this.labelPlayerHP = this.add.text(this.cameras.main.width - 220, 2, "Your HP", { fontSize: '16px', fill: '#FFFFFF' });
    this.updatePlayerHealthBar(this.playerHealth)


    // Initialize opponent's HP Label, placed below players health bar
    this.opponentHealthBar = this.add.graphics();
    this.labelOpponentHP = this.add.text(this.cameras.main.width - 220, 31, "Opponent's HP", { fontSize: '16px', fill: '#FFFFFF' });
    this.updateOpponentHealthBar(this.playerHealth)


    // Listen for the Escape key to return to the main menu
    this.input.keyboard.on('keydown-ESC', () => {
    this.scene.start('MainMenuScene');
    });

    this.cursor=this.input.keyboard.createCursorKeys();
    this.shootKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);


    this.socket.on('createAsteroid', function (asteroidInfo) {
      self.createAsteroid(self,asteroidInfo);
    });


    this.socket.on('removeAsteroid', function (asteroidId) {
      self.removeAsteroid(self,asteroidId);
    });

    this.socket.on('updateHealth', function (playerId, health){
      if (self.player.id === playerId) {
        self.updatePlayerHealthBar(health)
        if (health <=0) {
          self.socket.emit('gameOverHealth', playerId)
        }
      }
      else {
        self.updateOpponentHealthBar(health)
        if (health <=0) {
          self.socket.emit('gameOverHealth', playerId)
        }
        
      }
    })

    this.socket.on('createBullet', function (bulletInfo, bulletId) {
      self.createBullet(self,bulletInfo, bulletId);
    })

    this.socket.on('removeBullet', function (bulletId) {
      self.removeBullet(self, bulletId);
    })

    this.socket.on('createHealthPack', function (healthPackInfo, healthPackId){
      self.createHealthPack(self,healthPackInfo, healthPackId)
    })

    this.socket.on('removeHealthPack', function (healthPackId){
      self.removeHealthPack(self,healthPackId)
    })

    this.socket.on('endGameScore', function(winnerId){
      self.endGameScore(self,winnerId)
    })

    this.socket.on('endGameHealth', function(loserId){
      self.endGameHealth(self,loserId)
    })

}

  
update() {
  
  
  //Player  controls 
  if (this.player) {
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

    if (Phaser.Input.Keyboard.JustDown(this.shootKey)) {
      this.socket.emit('shootBullet', {x: this.player.x, y: this.player.y, rotation: this.player.rotation, playerId: this.player.id})
      // this.shootBullet(this.player); // Pass this.player as the argument
    }

    // Send updated player position to server when movement is detected
    var x = this.player.x;
    var y = this.player.y;
    var r = this.player.rotation;
    if (this.player.oldPosition && (x !== this.player.oldPosition.X || y !== this.player.oldPosition.Y || r !== this.player.oldPosition.rotation)) {
      this.socket.emit('playerMovement', { x: this.player.x, y: this.player.y, rotation: this.player.rotation });
    }

    // Save current position. This is used to check if a player had moved, and an update needs to be sent to the server
    this.player.oldPosition = {
    x: this.player.x,
    y: this.player.y,
    rotation: this.player.rotation
  };
  };
}

addPlayer(self, playerInfo) {
  // Add user controller player
  self.player = this.physics.add.image(playerInfo.x, playerInfo.y, 'shuttle');
    // Set the origin to the center of the sprite
  self.player.setOrigin(0.4, 0.5);
    // Enable collision with the world bounds
  self.player.setCollideWorldBounds(true);
    // Rotate the sprite to face upwards initially
  self.player.setRotation(-Math.PI / 2);
   // Adjust player dimensions
  self.player.body.setSize(newWidth, newHeight, false);
  self.player.body.setOffset(offsetX, offsetY);
  // Add player id
  self.player.id = playerInfo.playerId
  // Initialize health
  self.player.health = playerInfo.health
  self.player.score = playerInfo.score
 }

addOpponents(self,playerInfo) {
  // Add opposing players
  const opponent = this.physics.add.image(playerInfo.x, playerInfo.y, 'shuttle');
  opponent.setTint(0xff0000);
      // Enable collision with the world bounds
  opponent.setCollideWorldBounds(true);
    // Rotate the sprite to face upwards initially
  opponent.setRotation(-Math.PI / 2);
   // Adjust player dimensions
  opponent.body.setSize(newWidth, newHeight, false);
  opponent.body.setOffset(offsetX, offsetY);
  opponent.playerId=playerInfo.playerId;
  opponent.health = playerInfo.health;
  // opponent.health=playerInfo,health
  self.opponents.add(opponent);

 }

createAsteroid(self, asteroidInfo) {
  const asteroid = self.physics.add.image(asteroidInfo.x, asteroidInfo.y, 'asteroid');
  asteroid.id = asteroidInfo.id;
  self.asteroids.add(asteroid);
  if (asteroid){
    asteroid.setVelocity(asteroidInfo.velocityX,asteroidInfo.velocityY);
    asteroid.setCollideWorldBounds(true);
    asteroid.setBounce(1,1);
    // Emit collision event on collision with player
    self.physics.add.collider(self.player, asteroid, (player, asteroid) => {
      this.socket.emit('shipAsteroidCollision', player.id, asteroid.id); // Emit event w/ asteroid ID and player ID involved in collision
      this.sound.play('explosionSound');
    }
    )
  }



  
}

removeAsteroid(self, asteroidId) {
  // console.log('Removing asteroid')
  self.asteroids.getChildren().forEach(function (asteroid) {
    if (asteroid.id === asteroidId) {
      asteroid.destroy();
    };
  });
}

updatePlayerHealthBar(playerHealth) {
  this.playerHealthBar.clear(); // Clear the old drawing
  this.playerHealthBar.fillStyle(0x00ff00, 1); // Set the color of the health bar

  // Calculate the width of the health bar based on the player's current health
  const healthPercentage = playerHealth / 100;
  const healthBarWidth = 200 * healthPercentage; // 200 is the max width of the health bar

  // Draw the health bar
  this.playerHealthBar.fillRect(this.cameras.main.width - 220, 16, healthBarWidth, 16);

}

updateOpponentHealthBar(opponentHealth) {
  this.opponentHealthBar.clear();


  const baseX = this.cameras.main.width - 220; // Position based on the screen width
  const baseY = 20; // Y position starting point for health bars at the top of the screen
  const spacing = 10; // Vertical spacing between health bars
  const healthBarHeight = 16; // The height of the health bar

  // Calculate Y position for player2's health bar to be below player1's
  const opponentHealthBarY = baseY + healthBarHeight + spacing;

  // Draw the background for player2's health bar
  this.opponentHealthBar.fillStyle(0x000000); // Black color for the background
  this.opponentHealthBar.fillRect(baseX, opponentHealthBarY, 200, healthBarHeight);

  // Draw the health fill for player2's health bar
  this.opponentHealthBar.fillStyle(0x00ff00); // Green color for the health
  const fillWidth = Phaser.Math.Clamp(opponentHealth, 0, 100) * 2; // Convert health to fill width
  this.opponentHealthBar.fillRect(baseX, opponentHealthBarY, fillWidth, healthBarHeight);
}

createBullet(self,bulletInfo, bulletId) {
  const offset = self.player.displayWidth ;
  const point = new Phaser.Geom.Point(bulletInfo.x + Math.cos(bulletInfo.rotation), bulletInfo.y + offset * Math.sin(bulletInfo.rotation));
  const missile = self.bullets.create(point.x,point.y, 'missile');
  if (missile) {
    missile.setActive(true).setVisible(true);
      this.physics.velocityFromRotation(bulletInfo.rotation, 400, missile.body.velocity);
      missile.rotation = bulletInfo.rotation;
      missile.playerId = bulletInfo.playerId;
      missile.bulletId = bulletId;
      this.sound.play('shootSound');
      // Emit event on collision with asteroid 
      self.physics.add.collider(missile, self.asteroids, (missile, asteroids) =>{
        this.socket.emit('bulletAsteroidCollision', missile.playerId, missile.bulletId, asteroids.id)
        this.sound.play('explosionSound'); 
      })
      // Emit even on cllision with opponent
      self.physics.add.collider(missile, self.opponents, (missile, opponents) =>{
        console.log('hit opponent')
        this.socket.emit('bulletPlayerCollision', missile.playerId, missile.bulletId, opponents.playerId)
        this.sound.play('explosionSound'); 
      })
  }
}

removeBullet(self, id) {
  self.bullets.getChildren().forEach(function (bullet){
    if (bullet.bulletId === id){
      bullet.destroy()
    };
  });

}

createHealthPack(self,healthPackInfo, healthPackId) {
  const healthPack = self.physics.add.image(healthPackInfo.x, healthPackInfo.y, 'healthPack')
  healthPack.id = healthPackId;
  self.healthPacks.add(healthPack);
  if (healthPack){
    self.physics.add.overlap(self.player, healthPack, (player, healthPack) => {
      this.socket.emit('playerHealthPackOverlap', player.id, healthPack.id);
      this.sound.play('healSound');
    })
  }
}

removeHealthPack(self, healthPackId) {
  console.log('Removing health pack ' + healthPackId)
  self.healthPacks.getChildren().forEach(function (healthPack) {
    if (healthPack.id === healthPackId) {
      healthPack.destroy();
    };
  });
}

endGameScore(self,winnerId){
  this.physics.pause();

  // Clear items from screen
  this.bullets.clear(true, true); 
  this.asteroids.clear(true, true);
  this.healthPacks.clear(true,true);

  // Display message
  if (self.player.id===winnerId){
    var gameOverText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 100, "Congratulations, you have won!", { fontSize: '32px', fill: '#0000FF' }).setOrigin(0.5);
  }
  else {
    var gameOverText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 100, "You have been defeated!", { fontSize: '32px', fill: '#ff0000' }).setOrigin(0.5);
  };
}

endGameHealth(self,loserId){
  this.physics.pause();

  // Clear items from screen
  this.bullets.clear(true, true); 
  this.asteroids.clear(true, true);
  this.healthPacks.clear(true,true);

  // Display message
  if (self.player.id!==loserId){
    var gameOverText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 100, "Congratulations, you have won!", { fontSize: '32px', fill: '#0000FF' }).setOrigin(0.5);
  }
  else {
    var gameOverText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 100, "You have been defeated!", { fontSize: '32px', fill: '#ff0000' }).setOrigin(0.5);
  };
}

}


const config = {
  type:Phaser.AUTO,
  width:sizes.width,
  height:sizes.height,
  parent: 'phaser-asteroids',
  // canvas:gameCanvas,
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