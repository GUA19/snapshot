class Obex_spot {
    // example: binance
    constructor(source) {
        this.name = source.name;
        this.type = source.type;
        this.on = source.on
        this.trading = source.trading
        this.worth = 0
        console.log(this.name, "Init over!")
    }

    updateAmple(source, _allTokens, _allObexTradingPairs, _allEvmChainClients) {
        this.on = source.on
        this.trading = source.trading
        return
    }
}

module.exports = Obex_spot