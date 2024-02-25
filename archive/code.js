class Laser extends Phaser.Physics.Matter.Sprite
{
    lifespan;

    constructor (world, x, y, texture, bodyOptions)
    {
        super(world, x, y, texture, null, { plugin: bodyOptions });

        this.setFrictionAir(0);
        this.setFixedRotation();
        this.setActive(false);

        this.scene.add.existing(this);

        this.world.remove(this.body, true);
    }

    fire (x, y, angle, speed)
    {
        // This sets the initial x,y location to the sprites location, and fires at the same angle as the ship
        this.world.add(this.body);

        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);

        this.setRotation(angle);
        this.setVelocityX(speed * Math.cos(angle));
        this.setVelocityY(speed * Math.sin(angle));

        this.lifespan = 1000; // bullet dissapears after 1000ms
    }

    preUpdate (time, delta)
    {
        super.preUpdate(time, delta);

        // Update lifespan
        this.lifespan -= delta;

        // Remove body when lifespan is reached
        if (this.lifespan <= 0)
        {
            this.setActive(false);
            this.setVisible(false);
            this.world.remove(this.body, true);
        }
    }
}

class Asteroid extends Phaser.Physics.Matter.Sprite
// See here for reference: https://labs.phaser.io/edit.html?src=src/physics\matterjs\bullet%20pool.js
{
    constructor (world, x, y, bodyOptions)
    {
        super(world, x, y, 'asteroids', null, { plugin: bodyOptions });

        // this.setCircle(15); // This line prevents Asteroids from wrapping correctly, I can't figure out why
        this.setFrictionAir(0);

        this.scene.add.existing(this);

        const angle = Phaser.Math.Between(0, 360); // set random angle for asteroids to appear
        const speed = Phaser.Math.FloatBetween(1, 2); // set random speed

        this.setAngle(angle);

        this.setAngularVelocity(Phaser.Math.FloatBetween(-0.01, 0.01));

        this.setVelocityX(speed * Math.cos(angle));
        this.setVelocityY(speed * Math.sin(angle));
    }

    preUpdate (time, delta)
    {
        super.preUpdate(time, delta);
    }
}

class Asteroids_Demo extends Phaser.Scene
{
    // set globals
    cursors;
    sprite;
    asteroids;
    lasers;
    asteroidsCollisionCategory;
    spriteCollisionCategory;
    laserCollisionCategory;
    score = 0;
    scoreText;


    // preload game assets
    preload() {
        this.load.image('ship', 'assets/ship.png');
        this.load.image('space', 'assets/space.png');
        this.load.spritesheet('asteroids', 'assets/asteroid.png', { frameWidth: 40, fameHeight: 40 });
        this.load.image('laser', 'assets/laser.png');
    }

    // create game world
    create() {

        // allows objects to wrap back into scene
        const wrapBounds = {
            wrap: {
                min: { x: 0, y: 0 },
                max: { x: 800, y: 600 }
            }
        };



        this.spriteCollisionCategory = this.matter.world.nextCategory();
        this.laserCollisionCategory = this.matter.world.nextCategory();
        this.asteroidsCollisionCategory = this.matter.world.nextCategory();

        // load backgrounc and sprite
        this.background = this.add.image(400,300,'space');
        this.sprite = this.matter.add.image(400, 300, 'ship', null, { plugin: wrapBounds });
        this.scoreText = this.add.text(0, 0, '   Score: 0', { fill: '#00ff00' });


        // Set movement parameters
        this.sprite.setFrictionAir(0.02);


        this.lasers = [];

        for (let i = 0; i < 20; i++)
        {
            const laser = new Laser(this.matter.world, 0, 0, 'laser', wrapBounds);

            laser.setCollisionCategory(this.laserCollisionCategory);
            laser.setCollidesWith([ this.asteroidsCollisionCategory ]);
            laser.setOnCollide(this.laserVsAsteroid);
            this.lasers.push(laser);
        }




        // Create asteroids. Upper limit of range is the number of asteroids that will be generated
        this.asteroids = [];
        for (let i = 0; i < 7; i++)
        {
            // Set coordinates to random location
            const x = Phaser.Math.Between(0, 800);
            const y = Phaser.Math.Between(0, 600);

            const asteroid = new Asteroid(this.matter.world, x, y, wrapBounds);
            asteroid.setCollisionCategory(this.asteroidsCollisionCategory);
            asteroid.setCollidesWith([ this.spriteCollisionCategory, this.laserCollisionCategory ]); // Asteroids will ONLY collide with ships or lasers.
            // Setting this paramater allows asteroids to overlap without bouncing off eachother

            this.asteroids.push(asteroid);
        }


        // generate cursor object to allow keyboard input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown-SPACE', () => {

            const laser = this.lasers.find(laser => !laser.active);

            if (laser)
            {
                laser.fire(this.sprite.x, this.sprite.y, this.sprite.rotation, 5);
            }

        });


    }





    update()
    {
        if (this.cursors.left.isDown)
        {
            this.sprite.setAngularVelocity(-0.05);
        }
        else if (this.cursors.right.isDown)
        {
            this.sprite.setAngularVelocity(0.05);
        }
        else
        {
            this.sprite.setAngularVelocity(0);
        }

        if (this.cursors.up.isDown)
        {
            this.sprite.thrust(0.00025);
        }

        else if (this.cursors.down.isDown)
        {
            this.sprite.thrust(-.0000125);
        }

    }


    laserVsAsteroid = (collisionData) =>
    // Remove laser and asteroid on collision, iterate score
    // Use arrow function to ensure Asteroids_Demo instance is being referenced
    {
        const laser = collisionData.bodyA.gameObject;
        const asteroid = collisionData.bodyB.gameObject;

        // remove laser on collision
        laser.setActive(false);
        laser.setVisible(false);
        laser.world.remove(laser.body, true);

        // remove asteroid on collision
        asteroid.setActive(false);
        asteroid.setVisible(false);
        asteroid.world.remove(asteroid.body, true);

        // Iterate score and update text
        this.score +=10;
        if (this.scoreText) {
        this.scoreText.setText('   Score: ' + this.score); 


        // There's probably a better way of doing this, but this will generate a new asteroid each time one is destroyed. Uses the same code from create()
        const wrapBounds = {
            wrap: {
                min: { x: 0, y: 0 },
                max: { x: 800, y: 600 }
            }
        };

        const x = Phaser.Math.Between(0, 800);
        const y = Phaser.Math.Between(0, 600);

        const asteroid = new Asteroid(this.matter.world, x, y, wrapBounds);
        // asteroid.setCircle(15);
        asteroid.setCollisionCategory(this.asteroidsCollisionCategory);
        asteroid.setCollidesWith([ this.spriteCollisionCategory, this.laserCollisionCategory ]); // Asteroids will ONLY collide with ships or lasers.
        // Setting this paramater allows asteroids to overlap without bouncing off eachother

        this.asteroids.push(asteroid);
    }

    }
}

// Matter physics plugin being used for this game
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#000000',
    parent: 'phaser-asteroids',
    physics: {
        default: 'matter',
        matter: {
            debug: false,
            plugins: {
                wrap: true
            },
            gravity: {
                x: 0,
                y: 0
            }
        }
    },
    scene: Asteroids_Demo
};

// create Phaser.Game object

const game = new Phaser.Game(config);


