const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const grpc_promise = require('grpc-promise');
require('dotenv').config()

const packageDefinition = protoLoader.loadSync(
    process.env.GRPCSWIRLROOTPATH,
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    }
);
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const swirl = protoDescriptor.swirl;

class grpcClient_swirlV2 {
    constructor() {
        this.client = new swirl.SwirlRouter(process.env.GRPCSWIRLIP, grpc.credentials.createInsecure())
        grpc_promise.promisifyAll(this.client, { timeout: 500 });
    }

    async GetWalletStatus(source, contractAddress) {
        try {
            let res = await this.client.GetWalletStatus().sendMessage({
                chain_name: source,
                address: contractAddress,
            })
            return res.tokens;
        } catch (error) {
            console.log("🚀 ~ file: GrpcClient_swirlV2.js ~ line 33 ~ grpcClient_swirlV2 ~ GetWalletStatus ~ error", error, source, contractAddress)
            return []
        }
    }
    
    async GetWorkerBalance() {
        try {
            let res = await this.client.GetAllEVMChainWorkers().sendMessage({})
            return res.workers;
        } catch (error) {
            console.log("🚀 ~ file: GrpcClient_swirlV2.js ~ line 51 ~ grpcClient_swirlV2 ~ GetWorkerBalance ~ error", error)
            return []
        }
    }

}

module.exports = grpcClient_swirlV2