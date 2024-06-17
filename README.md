
# 2D Space Game - Local Multiplayer Setup

## Instructions to Run Local Multiplayer in Separate Browsers

### 1. Clone the Repository

```sh
git clone https://github.com/hayasep/2DSpaceGame
```

### 2. Navigate to the Project Directory

```sh
cd 2DSpaceGame
```

### 3. Switch to the Multiplayer Branch

```sh
git checkout multiplayer
```

### 4. Install Server Dependencies

```sh
npm install
```

### 5. Launch the Server

```sh
npm run start
```



### 6. Open a New Terminal and Navigate to the Client Directory

```sh
cd 2DSpaceGame/client
```

### 7. Install Client Dependencies

```sh
npm install
```

### 8. Launch the Client

```sh
npm start
```



A browser window should open that is connected to your local host (if not, go to [http://localhost:8080/](http://localhost:8080/) in your browser). Open up a second browser window and go to the same address.

### 9. Start the Game

Hit start game in each window and the game should now be running. Hit start to confirm both users have connected:



### 10. Restarting the Game

To play the game again once it’s finished, kill the server in the terminal (Ctrl+C) and restart it with the same command:

```sh
npm run start
```

Once you refresh each browser page, you should be able to play again.

---

Repository: [2DSpaceGame](https://github.com/hayasep/2DSpaceGame)
