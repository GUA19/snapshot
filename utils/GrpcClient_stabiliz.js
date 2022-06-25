const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const grpc_promise = require('grpc-promise');
require('dotenv').config()

const packageDefinition = protoLoader.loadSync(
    process.env.GRPCSTABILIZROOTPATH,
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    }
);
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const stabilizpb = protoDescriptor.stabilizpb;

class grpcClient_stabiliz {
    constructor() {
        this.client = new stabilizpb.Stabiliz(process.env.GRPCSTABILIZIP, grpc.credentials.createInsecure());
        grpc_promise.promisifyAll(this.client, { timeout: 500 });
    }

    async GetPosition(source, market) {
        if (source == "binance_futures") {
            market = market + "USDT"
        } else if (source == "dydx") {
            market = market + "-USD"
        } else if (source == "ftx") {
            market = market + "-PERP"
        }
        try {
            let res = await this.client.GetContractPosition().sendMessage({
                source: source,
                name: market,
            })
            return parseFloat(res.position)
        } catch (error) {
            console.log(error);
            return 0
        }
    }

    async GetBalance(source, asset) {
        try {
            let res = await this.client.GetTokenBalance().sendMessage({
                source: source,
                name: asset,
            })
            return parseFloat(res.balance);
        } catch (error) {
            console.log(error);
            return 0
        }
    }
}

module.exports = grpcClient_stabiliz