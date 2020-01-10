var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
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

var isFliped = false;
var isMoved = 0;

function create() {
    this.socket = io();
    var self  = this;
    this.socket.on('currentPlayers', function (players) {
        Object.keys(players).forEach(function(id) {
            if(players[id].playerId === self.socket.id) {
                addPlayer(self, players[id]);
            } else {
                addOtherPlayers(self, players[id]);
            }
        });
    });

    this.socket.on('newPlayer', function (playerInfo) {
        addOtherPlayers(self, playerInfo);
    });

    this.socket.on('disconnect', function(playerId) {
        // this.otherPlayers.getChildren().forEach(function(otherPlayers) {
        //     if(playerId === otherPlayer.playerId) {
        //         otherPlayer.destroy();
        //     }
        // });
    });

    this.socket.on('playerFlipped', function(playerInfo) {
        // this.otherPlayer.getChildren().forEach(function(otherPlayer) {
        //     if(playerInfo.playerId === otherPlayer.playerId) {
        //         ////asdfasdf
        //         console.log(playerInfo);
        //     }
        // });
    });

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


//    this.add.sprite(100, 200, 'deck', 'Card_back').setScale(.5).angle += 90;


    this.anims.create({
        key: 'flip',
        defaultTextureKey: 'deck',
        frames: [
            {key: 'deck', frame: currCard, duration: 100 } 
        ],
        frameRate: 10,
        delay: 100, 
    });

    cursors = this.input.activePointer;
}

function addPlayer(self, playerInfo) {
}

function addOtherPlayers(self, playerInfo) {
}

function update() {
     if (cursors.isDown && !isFliped) {
        isFliped = true;
        card.play('flip');
        this.socket.emit('playerFlipping');
    } else if (isFliped && isMoved < 5) {
        isMoved += 1;
        card.y -= 60;
        card.x -= 61;
    }
}