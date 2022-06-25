class Obex_futures {
    // example: binance_futures
    constructor(source, allTokens, allObexTradingPairs) {
        this.name = source.name;
        this.type = source.type;
        this.on = source.on
        this.trading = source.trading
        // ample config
        this.tokensArr = new Array();
        this.setTokensArr(allTokens)
        this.obexTradingPairsArr = new Array();
        this.setObexTradingPairsArr(allObexTradingPairs)
        //
        this.assetDic = {}
        this.updateAssetDic()
        this.assetPriceDic = {}
        this.updateAssetPriceDic()
        this.assetBalanceDic = {}
        this.assetPositionDic = {}
        this.worth = 0
        this.updateAssetBalanceDicAndAssetPositionDicAndWorth()        
        console.log(this.name, "Init over!")
    }

    // ample
    updateAmple(source, allTokens, allObexTradingPairs, _allEvmChainClients) {
        this.on = source.on
        this.trading = source.trading
        this.setTokensArr(allTokens)
        this.setObexTradingPairsArr(allObexTradingPairs)
        this.updateAssetDic()
        return
    }

    setTokensArr(allTokens) {
        let arr = new Array();
        for (let token of allTokens) {
            if (token.source == this.name) {
                arr.push(token)
            }
        }
        this.tokensArr = arr
    }

    setObexTradingPairsArr(allObexTradingPairs) {
        let arr = new Array();
        for (let pair of allObexTradingPairs) {
            if (pair.exchangeName == this.name) {
                arr.push(pair)
            }
        }
        this.obexTradingPairsArr = arr
    }

    //
    updateAssetDic() {
        let assetDic = {}
        for (let assetInfo of this.tokensArr) {
            assetDic[assetInfo.assetName] = 0
        }
        for (let obexTradingPair of this.obexTradingPairsArr) {
            assetDic[obexTradingPair.baseAsset] = 0
            assetDic[obexTradingPair.quoteAsset] = 0
        }
        this.assetDic = assetDic
    }

    async updateAssetPriceDic() {
        let dic = {}
        for (let asset in this.assetDic) {
            try {
                dic[asset] = await global.rainbowMistGrpcClient.PriceQuoter(asset)
            } catch (error) {
                console.log("🚀 ~ file: obex_futures.js ~ line 77 ~ Obex_futures ~ updateAssetPriceDic ~ error", this.name, asset, error)
            }
        }
        this.assetPriceDic = dic
    }

    async updateAssetBalanceDicAndAssetPositionDicAndWorth() {
        let balanceDic = {}
        let positionDic = {}
        for (let asset in this.assetDic) {
            try {
                balanceDic[asset] = await global.stabilizGrpcClient.GetBalance(this.name, asset)
                positionDic[asset] = await global.stabilizGrpcClient.GetPosition(this.name, asset)   
            } catch (error) {
                console.log("🚀 ~ file: obex_futures.js ~ line 91 ~ Obex_futures ~ updateAssetBalanceDicAndAssetPositionDicAndWorth ~ error", this.name, asset, error)
            }
        }
        this.assetBalanceDic = balanceDic
        this.assetPositionDic = positionDic
        let worth = 0
        for (let asset in this.assetBalanceDic) {
            worth += this.assetBalanceDic[asset] * this.assetPriceDic[asset]
        }
        this.worth = worth
    }

    getAssetBalanceDic() {
        return this.assetBalanceDic
    }

    getAssetPositionDic() {
        return this.assetPositionDic
    }
}

module.exports = Obex_futures