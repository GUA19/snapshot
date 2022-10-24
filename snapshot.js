const schedule = require('node-schedule');
const Controller = require('./controllerLite');
const controller = new Controller();

const GrpcClientSwirlV2 = require('./utils/GrpcClient_swirlV2');
const GrpcClientRainbowMist = require('./utils/GrpcClient_rainbowmist');
const GrpcClientStabiliz = require('./utils/GrpcClient_stabiliz');
const GrpcClientLogy = require('./utils/GrpcClient_logy');
global.swirlV2GrpcClient = new GrpcClientSwirlV2()
global.rainbowMistGrpcClient = new GrpcClientRainbowMist()
global.stabilizGrpcClient = new GrpcClientStabiliz()
global.logyGrpcClient = new GrpcClientLogy()

const MongoClient = require('./utils/MongoClient');
global.mongoClient = new MongoClient()

schedule.scheduleJob('*/1 * * * *', async function () { // at every minute 
    await controller.updateAmple()
    await controller.updateWorkerBalance()
    await controller.updatePriceBalancePosition()
    // console.log(controller.exportSnapshot())
    let dic = controller.exportSnapshot()
    const ss = global.mongoClient.getCollectionSnapshot('portfolio_1m');
    await ss.insertOne(dic)
    console.log(dic.timestamp, ' ', dic.worth)
    global.logyGrpcClient.SubmitLogsWithoutStream(controller.exportLogy())
});