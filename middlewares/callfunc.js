import boom from "boom";
import _ from "lodash";

export const callFunc = (conn, params, routerKey, config) => {
    return new Promise((resolve, reject) => {
        let timeId = 0;
        try {
            timeId = setTimeout(() => {
                reject(boom.clientTimeout(conn.socket.id, "---" + conn.jobs + "--timeout--" + config.timeout));
            }, config.timeout);

            conn.socket.clientProxy[routerKey](params).onReady((result) => {
                if (!result || result.isBoom) {
                    return reject(result || boom.create(609, "没有返回值"));
                }
                clearTimeout(timeId);
                resolve(result);
            });

        } catch (err) {
            reject(err);
        }
    });
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