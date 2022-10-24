const grpc = require('grpc')
const protoLoader = require('@grpc/proto-loader');
const grpc_promise = require('grpc-promise');
require('dotenv').config()

const packageDefinition = protoLoader.loadSync(
    process.env.GRPCLOGYROOTPATH,
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    }
);
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const logypb = protoDescriptor.logy;

class grpcClient_logy {
    constructor() {
        this.client = new logypb.Logy(process.env.GRPCLOGYIP, grpc.credentials.createInsecure());
        grpc_promise.promisifyAll(this.client, { timeout: 500 });
    }

    async SubmitLogsWithoutStream(bytesArray) {
        try {
            await this.client.SubmitLogsWithoutStream()
                .sendMessage({
                    app: "snapshot",
                    component: "main",
                    instance: "i0",
                    submit_type: 0,
                    logs: bytesArray
                })
            return 1
        } catch (error) {
            console.log(error)
            return 0
        }
    }
}

module.exports = grpcClient_logy