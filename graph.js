const PokerHand = require('./pokerHand.js');
var poker = require('./poker.json');

class PokerHandGraph {
    constructor() {
        this.hands = [];
    }

    addHand(hand) {
        this.hands.push(hand);
    }

}

module.exports = PokerHandGraph