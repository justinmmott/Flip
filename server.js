var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

var players = {};

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

var playersReady = [];
var playersDoneFlipping = 0;
var currentWinner;
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

    socket.emit('currentPlayer', players);

    socket.broadcast.emit('newPlayer', players[socket.id]);


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

    socket.on('ready', function(playerId) {
        playersReady.push(playerId);
        if(playersReady.length === Object.keys(players).length) {
            socket.broadcast.emit('gameStart');
            didGameStart = true;
        }
    });

    socket.on('playerFlipping', function () {
        var curr_card = players[socket.id].deckLeft.pop();
        players[socket.id].deckPlayed.push(curr_card);
        //updateBestHand(players[socket.id]);
        console.log("SomeoneFlipped");
        socket.broadcast.emit('playerFlipped', players[socket.id]);
    });

    socket.on('doneFlipping', function() {
        playersDoneFlipping += 1;
        if(playersDoneFlipping === Object.keys(players).length) {
            socket.broadcast.emit('gameOver', currentWinner);
        }
    });

});

server.listen(8081, function() {
    console.log(`Listening on ${server.address().port}`);
});