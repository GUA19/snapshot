const chain_evm = require('./sources/chain_evm');
const chain_other = require('./sources/chain_other');
const obex_futures = require('./sources/obex_futures');
const obex_spot = require('./sources/obex_spot');

class Controller {
    constructor() {
        this.sourceDic = {}
        setTimeout(async () => {
            let allSources = await global.mongoClient.AllSourcesQuoter()
            let allTokens = await global.mongoClient.AllTokensQuoter()
            let allObexTradingPairs = await global.mongoClient.AllObexTradingPairsQuoter()
            let allEvmChainClients = await global.mongoClient.AllChainEvmConfigQuoter()
            for (let source of allSources) {
                if(source.on) {
                    switch (source.type) {
                        case "chain-evm":
                            let chainEvm = new chain_evm(source, allTokens, allEvmChainClients)
                            this.sourceDic[source.name] = chainEvm
                            break;
                        case "chain-cosmos":
                        case "chain-aptos":
                            let chainOthers = new chain_other(source, allTokens)
                            this.sourceDic[source.name] = chainOthers
                            break;
                        case "obex-spot":
                            let obexSpot = new obex_spot(source)
                            this.sourceDic[source.name] = obexSpot
                            break;
                        case "obex-futures":
                            let obexFutures = new obex_futures(source, allTokens, allObexTradingPairs)
                            this.sourceDic[source.name] = obexFutures
                            break;
                        default:
                            break;
                    }
                }
            }
        }, 2 * 1000); // 2 seconds
    }

    async updateWorkerBalance() {
        let workerBalance = await global.swirlV2GrpcClient.GetWorkerBalance()
        let dic = {}
        for (let j of workerBalance) {
            if (!(j.chain_name in dic)) {
                dic[j.chain_name] = new Array()
            }
            dic[j.chain_name].push({
                source: j.chain_name,
                name: j.name,
                address: j.address,
                native_asset: j.asset,
                balance: j.balance,
            })
        }
        for (let k in dic) {
            this.sourceDic[k].setWorkerBalance(dic[k])
        }
    }

    // update the ample data & create a source object if there is no existing one
    async updateAmple() {
        let allSources = await global.mongoClient.AllSourcesQuoter()
        let allTokens = await global.mongoClient.AllTokensQuoter()
        let allObexTradingPairs = await global.mongoClient.AllObexTradingPairsQuoter()
        let allEvmChainClients = await global.mongoClient.AllChainEvmConfigQuoter()
        for (let source of allSources) {
            if (source.on) {
                if (this.sourceDic[source.name]) {
                    this.sourceDic[source.name].updateAmple(source, allTokens, allObexTradingPairs, allEvmChainClients)
                } else {
                    switch (source.type) {
                        case "chain-evm":
                            let chainEvm = new chain_evm(source, allTokens, allEvmChainClients)
                            this.sourceDic[source.name] = chainEvm
                            break;
                        case "chain-cosmos":
                        case "chain-aptos":
                            let chainOthers = new chain_other(source, allTokens)
                            this.sourceDic[source.name] = chainOthers
                            break;
                        case "obex-spot":
                            let obexSpot = new obex_spot(source)
                            this.sourceDic[source.name] = obexSpot
                            break;
                        case "obex-futures":
                            let obexFutures = new obex_futures(source, allTokens, allObexTradingPairs)
                            this.sourceDic[source.name] = obexFutures
                            break;
                        default:
                            break;
                    }
                }
            }
        }
    }

    async updatePriceBalancePosition() {
        for (let source in this.sourceDic) {
            if (this.sourceDic[source].type != "obex-spot") {
                await this.sourceDic[source].updateAssetPriceDic()
                await this.sourceDic[source].updateAssetBalanceDicAndAssetPositionDicAndWorth()
            }
        }
    }

    getPriceDic() {
        let dic = {}
        for (let source in this.sourceDic) {
            if (this.sourceDic[source].type != "obex-spot") {
                for (let asset in this.sourceDic[source].assetPriceDic) {
                    dic[asset] = this.sourceDic[source].assetPriceDic[asset]
                }
            }
        }
        return dic
    }

    getSourceAssetBalanceDic() {
        let dic = {}
        for (let source in this.sourceDic) {
            if (this.sourceDic[source].type != "obex-spot") {
                dic[source] = this.sourceDic[source].getAssetBalanceDic()
            }
        }
        return dic
    }

    getSourceAssetPositionDic() {
        let dic = {}
        for (let source in this.sourceDic) {
            if (this.sourceDic[source].type == "obex-futures") {
                dic[source] = this.sourceDic[source].getAssetPositionDic()
            }
        }
        return dic
    }

    getWorkerBalance() {
        let workers = new Array();
        for (let source in this.sourceDic) {
            if (this.sourceDic[source].type == "chain-evm") {
                workers = workers.concat(this.sourceDic[source].workerBalanceArr)
            }
        }
        return workers
    }

    getSpotDistribution() {
        let dic = {}
        for (let source in this.sourceDic) {
            if (this.sourceDic[source].type == "chain-evm" || this.sourceDic[source].type == "chain-cosmos" || this.sourceDic[source].type == "chain-aptos") {
                dic[source] = this.sourceDic[source].spotDistribution
            }
        }
        return dic
    }

    exportSnapshot() {
        let dic = {
            timestamp: new Date(),
            worth: 0,
            likelyMalformed: false,
            balance: this.getSourceAssetBalanceDic(),
            perpetualPosition: this.getSourceAssetPositionDic(),
            spotDistribution: this.getSpotDistribution(),
            workers: this.getWorkerBalance(),
            price: this.getPriceDic(),
        }
        let worth = 0;
        for (let source in dic.balance) {
            let count = 0
            for (let asset in dic.balance[source]) {
                if (source != "harmony") { // remove harmony from worth calculation
                    if (asset in dic.price) {
                        worth += dic.balance[source][asset] * dic.price[asset]
                    }
                }
                if (dic.balance[source][asset] == 0) {
                    count++
                }
            }
            if (count == Object.keys(dic.balance[source]).length && source != "dydx") {
                dic.likelyMalformed = true
            }
        }
        for (let worker of dic.workers) {
            if (worker.source != "harmony") { // remove harmony from worth calculation
                if (worker.native_asset in dic.price) {
                    worth += worker.balance * dic.price[worker.native_asset]
                }
            }
        }
        for (let source in dic.perpetualPosition) {
            let count = 0
            for (let asset in dic.perpetualPosition[source]) {
                if (dic.perpetualPosition[source][asset] == 0) {
                    count++
                }
            }
            if (count == Object.keys(dic.perpetualPosition[source]).length && source != "dydx") {
                dic.likelyMalformed = true
            }
        }
        dic.worth = worth
        return dic
    }

    exportLogy() {
        let array = []
        let priceDic = this.getPriceDic()
        let totalWorth = 0
        let totalLikelyMalformed = false
        for (let source in this.sourceDic) {
            totalWorth += this.sourceDic[source].worth
            if (this.sourceDic[source].type == "chain-evm" || this.sourceDic[source].type == "chain-cosmos" || this.sourceDic[source].type == "chain-aptos") {
                let count = 0
                let likelyMalformed = false
                let assetBalanceDic = this.sourceDic[source].getAssetBalanceDic()
                for (let asset in assetBalanceDic) {
                    if (assetBalanceDic[asset] == 0) {
                        count++
                    }
                }
                if (count == Object.keys(assetBalanceDic).length) {
                    likelyMalformed = true
                    totalLikelyMalformed = true
                }
                array.push(this.exportBalanceLog(source, likelyMalformed, assetBalanceDic))
                array.push(this.exportHoldingLog(source, likelyMalformed, this.sourceDic[source].spotDistribution))
                if (this.sourceDic[source].type == "chain-evm") {
                    array.push(this.exportWorkerBanlanceLog(source, likelyMalformed, this.sourceDic[source].workerBalanceArr))
                }
                array.push(this.exportWorthLog(source, likelyMalformed, this.sourceDic[source].worth))
            }
        }
        array.push(this.exportTotalWorthLog(totalLikelyMalformed, totalWorth))
        array.push(this.exportPriceLog(priceDic))
        return array
    }

    exportTotalWorthLog(likelyMalformed, worth) {
        let dic = {
            level: "info",
            ts: Date.parse(new Date()) * 1000000,
            msg: "new total worth snapshot",
            likelyMalformed: likelyMalformed,
            worth: worth,
        }
        let bytes = []
        let str = JSON.stringify(dic)
        for (let i = 0; i < str.length; ++i) {
            let code = str.charCodeAt(i);
            bytes = bytes.concat([code]);
        }
        return bytes
    }

    exportWorthLog(chainName, likelyMalformed, worth) {
        let dic = {
            level: "info",
            ts: Date.parse(new Date()) * 1000000,
            msg: "new vault total worth snapshot",
            chainName: chainName,
            likelyMalformed: likelyMalformed,
            worth: worth,
        }
        let bytes = []
        let str = JSON.stringify(dic)
        for (let i = 0; i < str.length; ++i) {
            let code = str.charCodeAt(i);
            bytes = bytes.concat([code]);
        }
        return bytes
    }

    exportBalanceLog(chainName, likelyMalformed, assetBalanceDic) {
        let dic = {
            level: "info",
            ts: Date.parse(new Date()) * 1000000,
            msg: "new vault token balance snapshot",
            chainName: chainName,
            likelyMalformed: likelyMalformed,
        }
        for (let asset in assetBalanceDic) {
            dic[asset] = assetBalanceDic[asset]
        }
        let bytes = []
        let str = JSON.stringify(dic)
        for (let i = 0; i < str.length; ++i) {
            let code = str.charCodeAt(i);
            bytes = bytes.concat([code]);
        }
        return bytes
    }

    exportHoldingLog(chainName, likelyMalformed, assetHoldingDic) {
        let dic = {
            level: "info",
            ts: Date.parse(new Date()) * 1000000,
            msg: "new vault token holding snapshot",
            chainName: chainName,
            likelyMalformed: likelyMalformed,
        }
        for (let asset in assetHoldingDic) {
            dic[asset] = assetHoldingDic[asset]
        }
        let bytes = []
        let str = JSON.stringify(dic)
        for (let i = 0; i < str.length; ++i) {
            let code = str.charCodeAt(i);
            bytes = bytes.concat([code]);
        }
        return bytes
    }

    exportWorkerBanlanceLog(chainName, likelyMalformed, workerBalanceArr) {
        let dic = {
            level: "info",
            ts: Date.parse(new Date()) * 1000000,
            msg: "new worker balance snapshot",
            chainName: chainName,
            likelyMalformed: likelyMalformed,
        }
        for (let worker of workerBalanceArr) {
            dic[worker.address] = worker.balance
        }
        let bytes = []
        let str = JSON.stringify(dic)
        for (let i = 0; i < str.length; ++i) {
            let code = str.charCodeAt(i);
            bytes = bytes.concat([code]);
        }
        return bytes
    }

    exportPriceLog(priceDic) {
        let dic = {
            level: "info",
            ts: Date.parse(new Date()) * 1000000,
            msg: "oracle price snapshot",
        }
        for (let asset in priceDic) {
            dic[asset] = priceDic[asset]
        }
        let bytes = []
        let str = JSON.stringify(dic)
        for (let i = 0; i < str.length; ++i) {
            let code = str.charCodeAt(i);
            bytes = bytes.concat([code]);
        }
        return bytes
    }
}

module.exports = Controller