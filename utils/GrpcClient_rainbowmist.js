const grpc = require('grpc')
const protoLoader = require('@grpc/proto-loader');
const grpc_promise = require('grpc-promise');
require('dotenv').config()

const packageDefinition = protoLoader.loadSync(
    process.env.GRPCRAINBOWROOTPATH,
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    }
);
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const rainbowmistpb = protoDescriptor.rainbowmist;

class grpcClient_rainbowmist {
    constructor() {
        this.client = new rainbowmistpb.Rainbowmist(process.env.GRPCRAINBOWMISTIP, grpc.credentials.createInsecure());
        grpc_promise.promisifyAll(this.client, { timeout: 500 });
    }

    async PriceQuoter(asset) {
        try {
            let res = await this.client.GetUSDPrice()
                .sendMessage({ 
                    asset: asset
                })
            if (res.status == false) {
                return 0
            }
            return res.price
        } catch (error) {
            if (asset != 'OSMO') {
                console.log(error, asset)
            }
            return 0
        }
    }
}

module.exports = grpcClient_rainbowmist