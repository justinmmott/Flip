var config = {
    type: Phaser.AUTO,
    scale: {
        parent: 'gameDiv',
        mode: Phaser.Scale.RESIZE,
        // width: 800,
        // height: 600
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

var card;
var cursors; 

// stupid stuff for the current flip animation
var isFliped = false;
var isMoved = 0;

function create() {
    this.socket = io();
    var self  = this; // I don't get why I need to do this but it errors if not
    
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
        // display sprite of card that was flipped
        card.play('flip'); // this is so that we can find the random card 
                           // based off of when they click, this may add
                           // lag tho since they have to wait for the server
                           // to respond so maybe we change this based off 
                           // of the option
    });

    // everyone has hit ready
    this.socket.on('gameStart', function() {
        // display sprites and check if it is your turn
    });

    // someone has won
    this.socket.on('gameOver', function(winner) {
        // display a win/loss screen for players
    });

    // most of the code below will probably go into gameStart
    // however this code has very little functionality just a 
    // good reference for how to use phaser

    var frames = this.textures.get('deck').getFrameNames();
    frames.splice( frames.indexOf('Card_back.svg'), 1 );
    var currCard = Phaser.Math.RND.pick(frames);

    var deckX = 400;
    var deckY = 450;

    this.add.sprite(deckX, deckY, 'deck', 'Card_back').setScale(.5);
    this.add.sprite(deckX + 5, deckY, 'deck', 'Card_back').setScale(.5);
    this.add.sprite(deckX + 10, deckY, 'deck', 'Card_back').setScale(.5);
    this.add.sprite(deckX + 15, deckY, 'deck', 'Card_back').setScale(.5);
    this.add.sprite(deckX + 20, deckY, 'deck', 'Card_back').setScale(.5);
    card = this.add.sprite(deckX + 25, deckY, 'deck', 'Card_back').setScale(.5);

    this.anims.create({
        key: 'flip',
        frames: [
            {key: 'deck', frame: currCard, duration: 100 } 
        ],
        frameRate: 10,
        delay: 100, 
    });

    cursors = this.input.activePointer; // doesn't work on mobile
}


// Use addPlayer and addOtherPlayers to place sprite at the beginning of 
// the game
function addPlayer(self, playerInfo) {

}

function addOtherPlayers(self, playerInfo) {
    // need to figure out how we want to place the players around the table
}

function update() {
     if (cursors.isDown && !isFliped) {
        isFliped = true;
        
        this.socket.emit('playerFlipping');

    } else if (isFliped && isMoved < 5) {
        isMoved += 1;
        card.y -= 60;
        card.x -= 61;
    }
}