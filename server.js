var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

var players = {}; // all player in game
var playersReady = []; // list of player objects that have hit ready
var playersDoneFlipping = 0; // unsure if we need this and if so 
                             // if it needs to be made into a 
                             // player object array
var currentWinner; // player object
var didGameStart = false;


io.on('connection', function(socket) {
    console.log('user connected', socket.id);
    players[socket.id] = {
        id: Object.keys(players).length,
        playerId: socket.id,
        x: null,
        y: null,
        deckLeft: [],
        deckPlayed: [],
        current_best_hand: []
    };

    // send the new player information about the other players
    socket.emit('currentPlayers', players);

    // tells everyone else that a new player has join the session
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // someone has disconnected
    socket.on('disconnect', function() {
        console.log('user disconnected', socket.id);
        delete players[socket.id];
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
        if(playersReady.length === Object.keys(players).length) {
            socket.broadcast.emit('gameStart');
            didGameStart = true;
        }
    });

    // a player has clicked to flip their card
    socket.on('playerFlipping', function () {
        var curr_card = players[socket.id].deckLeft.pop();
        players[socket.id].deckPlayed.push(curr_card);
        //flip a card
        //updateBestHand(players[socket.id]);
        io.emit('playerFlipped', {
            player: players[socket.id].id,
            card: 'card'
        });
    });

    // someone has flipped through their whole deck
    socket.on('doneFlipping', function() {
        playersDoneFlipping += 1;
        if(playersDoneFlipping === Object.keys(players).length) {
            io.emit('gameOver', currentWinner);
        }
    });

});

function updateBestHand(player) {
    
}

server.listen(8081, function() {
    console.log(`Listening on ${server.address().port}`);
});