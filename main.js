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
  }
  create(){
    this.add.image(0,0,"bg").setOrigin(0,0)
    this.player = this.physics.add.image(0,sizes.height-100,"shuttle").setOrigin(0,0)
    this.player.setImmovable(true)
    this.player.body.allowGravity = false
    this.player.setCollideWorldBounds(true)

    this.cursor=this.input.keyboard.createCursorKeys()
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
      gravity:{y:speedDown},
      debug:true
    }
  },
  scene:[GameScene]
}

const game = new Phaser.Game(config)