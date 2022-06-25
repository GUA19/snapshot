class Chain_evm {
    // example: bsc
    constructor(source, allTokens, allEvmChainClients) {
        this.name = source.name;
        this.type = source.type;
        this.on = source.on
        this.trading = source.trading
        // ample config
        this.tokensArr = new Array();
        this.setTokensArr(allTokens)
        this.evmChainClient = {}
        this.setEvmChainClient(allEvmChainClients)
        // 
        this.assetDic = {}
        this.updateAssetDic()
        this.assetPriceDic = {}
        this.updateAssetPriceDic()
        this.assetBalanceDic = {}
        this.workerBalanceArr = new Array();
        this.worth = 0
        this.spotDistribution = {}
        this.updateAssetBalanceDicAndAssetPositionDicAndWorth()
        console.log(this.name, "Init over!")
    }

    // ample
    updateAmple(source, allTokens, _allObexTradingPairs, allEvmChainClients) {
        this.on = source.on
        this.trading = source.trading
        this.setTokensArr(allTokens)
        this.setEvmChainClient(allEvmChainClients)
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

    setEvmChainClient(allEvmChainClients) {
        for (let client of allEvmChainClients) {
            if (client.chainName == this.name) {
                this.evmChainClient = client
            }
        }
    }

    //
    updateAssetDic() {
        let assetDic = {}
        for (let assetInfo of this.tokensArr) {
            assetDic[assetInfo.assetName] = 0
        }
        this.assetDic = assetDic
    }

    async updateAssetPriceDic() {
        let dic = {}
        for (let asset in this.assetDic) {
            try {
                dic[asset] = await global.rainbowMistGrpcClient.PriceQuoter(asset)
            } catch (error) {
                console.log("🚀 ~ file: chain_evm.js ~ line 150 ~ Chain_evm ~ updateAssetPriceDic ~ error", this.name, asset, error)
            }
        }
        this.assetPriceDic = dic
    }

    async updateAssetBalanceDicAndAssetPositionDicAndWorth() {
        try {
            if (this.on) {
                let dic = {}
                let walletTokens = await global.swirlV2GrpcClient.GetWalletStatus(this.name, this.evmChainClient.tradingContractAddress)
                for (let token of walletTokens) {
                    dic[token.asset_name] = parseFloat(token.balance)
                }
                this.assetBalanceDic = dic
                // calculate worth
                let worth = 0
                for (let asset in this.assetBalanceDic) {
                    if (asset in this.assetPriceDic) {
                        // there could be a situation that the wallet cotains some asset we don't know
                        worth += this.assetBalanceDic[asset] * this.assetPriceDic[asset]
                    }
                }
                // calculate spotDistribution
                let spotDistribution = {}
                for (let asset in this.assetBalanceDic) {
                    if (asset in this.assetPriceDic) {
                        spotDistribution[asset] = this.assetBalanceDic[asset] * this.assetPriceDic[asset] / worth * 100
                    }
                }
                this.worth = worth
                this.spotDistribution = spotDistribution
            }
        } catch (error) {
            console.log("🚀 ~ file: chain_evm.js ~ line 194 ~ Chain_evm ~ updateAssetBalanceDicAndAssetPositionDicAndWorth ~ error", this.name, error)
        }
    }

    getAssetBalanceDic() {
        return this.assetBalanceDic
    }

    setWorkerBalance(data) {
        this.workerBalanceArr = data
    }
}

module.exports = Chain_evm