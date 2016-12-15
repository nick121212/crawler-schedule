import http from "http";
import _ from "lodash";
import { Application } from "./lib/application";
import * as configUtils from "./lib/config";
import urlMiddle from "./middlewares/downloader.mq.js";
import downloadMiddle from "./middlewares/downloader";
import crawlerOptions from "./zhongyuan.json";

const config = configUtils.configFile();
const app = new Application();
const server = http.createServer();
const listenComplete = async() => {
    let queue = await urlMiddle(config.mq, config.download);

    await queue(async(qres, msg) => {
        let fn = app.callback();
        let ctx = {
            msg: msg,
            qres: qres,
            config: crawlerOptions
        };
        fn(ctx, (ctx) => {
            ctx.qres.ch.reject(ctx.msg);
        }).catch((err) => {
            if (err.output.statusCode !== 607) {
                console.error(err);
            }
            ctx.qres.ch.reject(ctx.msg);
        });
    });
    console.log(`listened on ${config.port || 3001}`);
}
const initApp = async() => {
    app.use(downloadMiddle({ timeout: 50000 }));
    app.use(async(ctx, next) => {
        if (ctx.result.isBoom || ctx.result.isError) {
            throw ctx.result;
        }
        console.log(`${ctx.queueItem.url} --  ${ JSON.stringify( ctx.result )} --complete ${new Date}`);
        await next();
    });
    app.on("error", (err) => {
        // console.error(err);
    });
    app.create(server, config.schedule || {});
    server.listen(config.port || 3001, listenComplete);
};

initApp();