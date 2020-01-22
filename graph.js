const PokerHand = require('./pokerHand.js');
const Card = require('./cards.js');
var poker = require('./poker.json');

const Straight_Flush = 0;
const Quads = 1;
const Full_House = 2;
const Flush = 3;
const Straight = 4;
const Trips = 5;
const Two_Pair = 6;
const Pair = 7;
const High_Card = 8;


class PokerHandGraph {
    constructor() {
        this.hands = [];
    }

    addHand(hand) {
        this.hands.push(hand);
    }

    bestHand(hand) {
        var suits = new Array(4).fill(0);
        var cards = new Array(13).fill(0);
        var res = new Array(9).fill(0);

        for(var card in hand.cards) {
            cards[card.value]++;
            suits[card.suit]++;
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
        if(res[Trips] > 0 && res[Pair] > 0){
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

}

module.exports = PokerHandGraph