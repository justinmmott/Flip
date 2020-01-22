const PokerHand = require('./pokerHand.js');
const Card = require('./cards.js');
var poker = require('./poker.json');

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
                res[3]++;
            }
        }

        var inARow = 0;
        for(var i = 0; i < cards.length; i++) {
            if(inARow > 5){
                res[4]++;
            }
            if(cards[i] > 0) {
                inARow++;
            }
            if(cards[i] === 4) {
                res[1]++;
            } else if(cards[i] === 3) {
                res[5]++;
            } else if(cards[i] === 2) {
                res[7]++;
            } else if(cards[i] === 1) {
                res[8]++;
            } else {
                inARow = 0;
            }
        }
        if(res[5] > 0 && res[7] > 0){
            res[2]++;
        }
        if(res[7] > 1) {
            res[6]++;
        }

        for(var i = 0; i < res.length; i++) {
            if(res[i] > 0) {
                return i;
            }
        }
    }

}

module.exports = PokerHandGraph