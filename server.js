var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var poker = require('./poker.json');
var shuffle = require('shuffle-array');

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

var publicPlayers = {}; // all player in game
var privatePlayers  = {};
var playersReady = []; // list of player objects that have hit ready
var playersDoneFlipping = 0; // unsure if we need this and if so 
                             // if it needs to be made into a 
                             // player object array
var currentWinner; // player object
var didGameStart = false;
var deck = poker['cards'];


io.on('connection', function(socket) {
    console.log('user connected', socket.id);
    publicPlayers[socket.id] = {
        id: Object.keys(publicPlayers).length,
        playerId: socket.id,
        current_best_hand: []
    };

    privatePlayers[socket.id] = {
        deckLeft: [],
        deckPlayed: []
    }

    // send the new player information about the other players
    socket.emit('currentPlayers', publicPlayers);

    // tells everyone else that a new player has join the session
    socket.broadcast.emit('newPlayer', publicPlayers[socket.id]);

    // someone has disconnected
    socket.on('disconnect', function() {
        console.log('user disconnected', socket.id);
        delete publicPlayers[socket.id];
        delete privatePlayers[socket.id];
        if(didGameStart) {
            io.emit('gameCancelled');
        }
        if(playersReady.includes(socket.id)) {
            playersReady.splice( playersReady.indexOf(socket.id), 1 );
        }

        io.emit('disconnect', socket.id);
    });

    // someone has readied up
    socket.on('ready', function(playerId) {
        playersReady.push(playerId);
        console.log(playersReady.length + "/" + Object.keys(publicPlayers).length + " players ready");
        if(playersReady.length === Object.keys(publicPlayers).length) {
            startGame();
        }
    });

    // a player has clicked to flip their card
    socket.on('playerFlipping', function () {
        console.log("flipping");
        var curr_card = privatePlayers[socket.id].deckLeft.pop();
        privatePlayers[socket.id].deckPlayed.push(curr_card);
        //flip a card
        //updateBestHand(players[socket.id]);
        io.emit('playerFlipped', {
            player: publicPlayers[socket.id].playerId,
            card: curr_card
        });
    });

    // someone has flipped through their whole deck
    socket.on('doneFlipping', function() {
        playersDoneFlipping += 1;
        if(playersDoneFlipping === Object.keys(publicPlayers).length) {
            io.emit('gameOver', currentWinner);
        }
    });

});

function updateBestHand(player) {
    
}

function startGame() {
    console.log('Starting game');
    shuffle(deck);
    var handSize = Math.floor(deck.length / Object.keys(publicPlayers).length);
    io.emit('gameStart', handSize);
    didGameStart = true;
    var i = 0;
    var j;
    Object.keys(privatePlayers).forEach(function(id) {
        for(j = i; j < i + handSize; j++) {
            privatePlayers[id]['deckLeft'].push(deck[j]);
        }
        i += handSize;
    });
}

server.listen(8081, function() {
    console.log(`Listening on ${server.address().port}`);
});