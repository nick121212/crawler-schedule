import boom from "boom";
import Promise from "bluebird";

export const callFunc = (conn, params, routerKey, config) => {
    return new Promise((resolve, reject) => {
        try {
            conn.socket.clientProxy[routerKey](params).onReady((result) => {
                console.log("crawler-schedule/middlewares/callfunc.js", routerKey, "返回了数据");
                if (!result || result.isBoom) {
                    return reject(result || boom.create(609, "没有返回值"));
                }
                resolve(result);
            });

        } catch (err) {
            reject(err);
        }
    }).timeout(config.timeout);
};

export default (config) => {
    return async(ctx, next) => {
        ctx.result = await callFunc(ctx.conn, {
            queueItem: ctx.queueItem,
            config: ctx.config
        }, ctx.routerKey, config);

        await next();
    };
};