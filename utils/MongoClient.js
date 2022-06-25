const mongodb = require('mongodb');
require('dotenv').config()


class MongoClient {
    constructor(){
        this.initConnection()
    }

    async initConnection(){
        this.client = await mongodb.MongoClient.connect(
            process.env.DBURL,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true
            }
        );
    }

    getCollectionSnapshot(collection) {
        return this.client.db('snapshot').collection(collection)
    }

    async AllSourcesQuoter() {
        let ample = this.client.db('ample').collection("sources")
        return (await ample.aggregate([],
            { allowDiskUse: true }
        ).toArray())
    }

    async AllTokensQuoter() {
        let ample = this.client.db('ample').collection("tokens")
        return (await ample.aggregate([],
            { allowDiskUse: true }
        ).toArray())
    }

    async AllObexTradingPairsQuoter() {
        let ample = this.client.db('ample').collection("obex_trading_pairs")
        return (await ample.aggregate([],
            { allowDiskUse: true }
        ).toArray())
    }

    async AllChainEvmConfigQuoter() {
        let ample = this.client.db('ample').collection("chain_evm_configs")
        return (await ample.aggregate([],
            { allowDiskUse: true }
        ).toArray())
    }
}

module.exports = MongoClient