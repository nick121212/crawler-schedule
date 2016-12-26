import spa from "nspa";
import mqMiddle from "../middlewares/mq";
import connMiddle from "../middlewares/connection";
import queueItemMiddle from "../middlewares/queueitem";
import callFuncMiddle from "../middlewares/callfunc";
import initApp from "./init";
import http from "http";

import setStatus from "../controller/setStatus";

class MainApp extends spa.Spa {
    constructor(_maxJobs) {
        super(_maxJobs);
    }

    onError(err, ctx) {
        super.onError(err, ctx);
        if (err.statusCode !== 607) {
            console.error(err);
        }
    }

    /**
     * 如果错误的次数大于200次，则丢弃掉消息
     * 
     */
    onComplete(ctx) {
        super.onComplete(ctx);

        setTimeout(() => {
            if (ctx.err) {
                if (~~ctx.errCount < 200) {
                    return ctx.context.ch.reject(ctx.msg);
                }
                ctx.context.ch.ack(ctx.msg);
            } else {
                ctx.context.ch.ack(ctx.msg);
            }
        }, 1000);
    }
}

const initServer = async(spaServer, config) => {
    const serverCompose = new spa.Spa();

    spaServer.attachRouteToSocket("setStatus", await setStatus(config));
    serverCompose.use(spaServer.attach(serverCompose));
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
    const app = new MainApp();
    const server = http.createServer();

    app.initServer(config.schedule || {}, server);
    await initServer(app.spaServer);
    app.use(mqMiddle(config.mq, app));
    app.use(connMiddle(app.spaServer.connections));
    app.use(await queueItemMiddle(config.elastic));
    app.use(callFuncMiddle({ timeout: 30000 }));
    app.use(async(ctx, next) => {
        if (ctx.queueItem) {
            console.log(`${ctx.queueItem.url} --  ${ctx.result.storeQueueItem } --complete ${new Date}`);
        }
        await next();
    });
    app.start(crawlerConfig);
    initApp(config, crawlerConfig, app.spaServer.connections);
    server.listen(3001);
};