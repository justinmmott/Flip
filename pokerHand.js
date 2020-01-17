class PokerHand {
    constructor(cards, typeOfHand, rankingWithin) {
        this.cards = cards;
        this.handLevel = typeOfHand;
        this.rankingWithin = rankingWithin;
        this.neighbors = [];
    }

    addNieghbor(hand) {
        this.neighbors.push(hand);
    }
}

module.exports = PokerHand