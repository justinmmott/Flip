var config = {
    type: Phaser.AUTO,
    backgroundColor: '#00b300',
    scale: {
        parent: 'gameDiv',
        mode: Phaser.Scale.RESIZE,
    },
    scene: {    
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);


function preload() {
    this.load.multiatlas('deck', 'assets/deck.json', 'assets');
}

var myCards = [];
var cursor; 
var touch;

var myId;
var OtherPlayers = {};

var deckSize;

// stupid stuff for the current flip animation
var isFlipped = false;
var isMoved = 0;
var flipAnim;
var canFlip = true;

var didGameStart = false;
var currCard;

var isReady = false;
var cardsFlipped = -1;

var depth;

function create() {
    console.log(game.scale.width);
    this.socket = io();
    var self  = this; 
    // the server will give you information on all other players that have 
    // joined the session
    this.socket.on('currentPlayers', function (players) {
        Object.keys(players).forEach(function(id) {
            if(players[id].playerId === self.socket.id) {
                addPlayer(self, players[id]);
            } else {
                addOtherPlayers(self, players[id]);
            }
        });
    });

    // A player has joined the game after you join the game
    this.socket.on('newPlayer', function (playerInfo) {
        addOtherPlayers(self, playerInfo);
    });


    // A player has disconnected 
    this.socket.on('disconnect', function(playerId) {
        // maybe have some logic that de-readys players 
    });

    // a player disconnected after the game began
    this.socket.on('gameCancelled', function() { 
        // maybe have some logic where if they player runs out of cards so 
        // they know they have lost than their disconnection won't cancel 
        // the game for everyone
    });

    // someone has flipped a card
    this.socket.on('playerFlipped', function(playerInfo) {
        if(playerInfo['player'] === self.socket.id) {
            self.anims.remove('flip');
            flipAnim = self.anims.create({
                key: 'flip',
                frames: [
                    {key: 'deck', frame: playerInfo['card'] , duration: 100 } 
                ],
                frameRate: 10,
                delay: 100, 
            });
                        // display sprite of card that was flipped
            currCard = myCards.pop();
            currCard.setDepth(-1 * depth);
            depth--;
            currCard.play('flip'); // this is so that we can find the random card 
                               // based off of when they click, this may add
                               // lag tho since they have to wait for the server
                               // to respond so maybe we change this based off 
                               // of the option
            isFlipped = true;
        }
    });

    // everyone has hit ready
    this.socket.on('gameStart', function(handSize) {
        // display sprites and check if it is your turn
        didGameStart = true;
        var scaleRatio = Math.sqrt((game.scale.width * game.scale.height * .02) / (167 * 242));
        var deckX = game.scale.width * .5;
        var deckY = game.scale.height * .8;

        
        for(var i = 0; i < handSize; i++) {
            myCards.push(self.add.sprite(deckX , deckY, 'deck', 'Card_back').setScale(scaleRatio));
        }
        deckSize = handSize;
        depth = handSize;

    });

    // someone has won
    this.socket.on('gameOver', function(winner) {
        // display a win/loss screen for players
    });

    // most of the code below will probably go into gameStart
    // however this code has very little functionality just a 
    // good reference for how to use phaser
    this.input.addPointer();
    cursor = this.input.activePointer; 
    touch = this.input.pointer1;

    this.clickButton = this.add.text(game.scale.width * .45, game.scale.height * .45, 'Ready', { fill: '#FF2D00', fontSize: '3.5vw' })
      .setInteractive()
      .on('pointerover', () => self.clickButton.setStyle({ fill: '#FFFFFF'}) )
      .on('pointerout', () =>  self.clickButton.setStyle({ fill: '#ff0'}) )
      .on('pointerdown', () => self.clickButton.setStyle({ fill: '#0ff' }) )
      .on('pointerup', () => {
        if(!isReady) {
            isReady = true;
            self.socket.emit('ready', self.socket.id);
        }
    });
}


// Use addPlayer and addOtherPlayers to place sprite at the beginning of 
// the game
function addPlayer(self, playerInfo) {
    myId = playerInfo.id;
}

function addOtherPlayers(self, playerInfo) {
    // need to figure out how we want to place the players around the table
    OtherPlayers[playerInfo.id] = 0;
}

function update() {
    if(isReady) {
        this.clickButton.destroy();
    }
    if((cursor.isDown || touch.isDown) && didGameStart && canFlip) {
        canFlip = false;
        cardsFlipped += 1;
        this.socket.emit('playerFlipping');
    }

    if(isFlipped && isMoved < 5) {
        isMoved += 1;
        currCard.x -= (game.scale.width * .05) - ((cardsFlipped % 5) * (currCard.displayWidth * .05));
        currCard.y -= (game.scale.height * .07) - (Math.floor(cardsFlipped / 5) * (currCard.displayHeight * .05));
    }

    if(isFlipped && isMoved === 5) {
        isFlipped = false;
        isMoved = 0;
    }

    if(!(cursor.isDown || touch.isDown) && cardsFlipped != deckSize - 1 && isMoved === 0) {
        canFlip = true;
    }
}