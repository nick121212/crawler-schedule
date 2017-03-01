import spa from "nspa";
import mqMiddle from "../middlewares/mq";
import connMiddle from "../middlewares/connection";
import queueItemMiddle from "../middlewares/queueitem";
import callFuncMiddle from "../middlewares/callfunc";
import initApp from "./init";
import http from "http";

import setStatus from "../controller/setStatus";

const initServer = async(spaServer, config) => {
    const serverCompose = new spa.Spa();

    spaServer.attachRouteToSocket("setStatus", await setStatus(config));
    serverCompose.use(spaServer.attach(serverCompose, () => {

    }));
    serverCompose.use(async(ctx, next) => {
        await next();
    });
    spaServer.on("onconnect", (connection, connectionObject) => {
        connection.clientProxy.status().onReady((result) => {
            connectionObject.jobs = ~~result.jobs;
        });
    });
};

export default async(config, crawlerConfig) => {
    const app = new spa.Spa();
    const server = http.createServer();

    app.initServer(config.schedule || {}, server);
    await initServer(app.spaServer);
    app.use(mqMiddle(config.mq, app));
    app.use(connMiddle(app.spaServer.connections));
    app.use(await queueItemMiddle(config.elastic));
    app.use(callFuncMiddle({ timeout: 30000 }));
    app.use(async(ctx, next) => {
        console.log(`crawler-schedule-main.js -- ${ctx.context.retId} -- ${ctx.routerKey} --complete ${new Date()}`);
        if (ctx.routerKey === "start") {
            console.log(`crawler-schedule-main.js -- ${ctx.queueItem.url} -- ${ctx.routerKey} --complete ${new Date()}`);
        }
        await next();
    });

    app.start(crawlerConfig);
    initApp(config, crawlerConfig, app.spaServer.connections);
    server.listen(config.port);
};