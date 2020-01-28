const PokerHand = require('./pokerHand.js');
const PokerHandGraph = require('./graph.js');
const Card = require('./card.js');

const Straight_Flush = 0;
const Quads = 1;
const Full_House = 2;
const Flush = 3;
const Straight = 4;
const Trips = 5;
const Two_Pair = 6;
const Pair = 7;
const High_Card = 8;

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
var currentBestHand =  9;
var didGameStart = false;
var deck = [];
var ordering = poker['ordering'];

var graph = createGraph();
//console.log(graph);


io.on('connection', function(socket) {
    console.log('user connected', socket.id);
    publicPlayers[socket.id] = {
        id: Object.keys(publicPlayers).length,
        playerId: socket.id,
    };

    privatePlayers[socket.id] = {
        current_best_hand: [],
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
        var curr_card = privatePlayers[socket.id].deckLeft.pop();
        privatePlayers[socket.id].deckPlayed.push(curr_card);
        //flip a card
        var best = updateBestHand(privatePlayers[socket.id]);
        if (best < currentBestHand) {
            currentBestHand = best;
        }
        io.emit('playerFlipped', {
            player: publicPlayers[socket.id].playerId,
            card: curr_card.spriteName
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
    var suits = new Array(4).fill(0);
    var cards = new Array(13).fill(0);
    var res = new Array(9).fill(0);

    for(var i = 0; i < player.deckPlayed.length; i++) {
        cards[player.deckPlayed[i].value]++;
        suits[player.deckPlayed[i].suit]++;
    }

    for(var i = 0; i < suits.length; i++) {
        if(suits[i] > 5) {
            res[Flush]++;
        }
    }

    var inARow = 0;
    for(var i = 0; i < cards.length; i++) {
        if(inARow > 5){
            res[Straight]++;
        }
        if(cards[i] > 0) {
            inARow++;
        }
        if(cards[i] === 4) {
            res[Quads]++;
        } else if(cards[i] === 3) {
            res[Trips]++;
        } else if(cards[i] === 2) {
            res[Pair]++;
        } else if(cards[i] === 1) {
            res[High_Card]++;
        } else {
            inARow = 0;
        }
    }
    if(res[Trips] > 2 || res[Trips] > 0 && res[Pair] > 0){
        res[Full_House]++;
    }
    if(res[Pair] > 1) {
        res[Two_Pair]++;
    }

    for(var i = 0; i < res.length; i++) {
        if(res[i] > 0) {
            return i;
        }
    }

}

function startGame() {
    console.log('Starting game');

    for (var i = 0; i < poker['cards'].length; i++) {
        deck.push(new Card( (i % 13) + 2, Math.floor(i / 13), poker['cards'][i]));
    }
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

function createGraph() {
    var g = new PokerHandGraph();

    // init graph with high cards
    for(var i = 0; i < ordering.length; i++) {
        var highCard = new PokerHand([ordering[i]], 8);
        g.addHand(highCard);   
    }

    // Make rest of hands
    
    return g;
}

server.listen(8081, function() {
    console.log(`Listening on ${server.address().port}`);
});