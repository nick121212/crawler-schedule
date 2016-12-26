import { mqFunc } from "crawler-common";
import _ from "lodash";

export default (config, app) => {
    app.start = async(crawlerConfig) => {
        let mq = await mqFunc(config);
        let qres = await mq.getQueue(_.extend({}, config, { name: config.name + crawlerConfig.key }));

        // 绑定路由到queue
        await qres.ch.bindQueue(qres.q.queue, "amq.topic", `crawler.urls.${crawlerConfig.key}`);
        // 每次消费1条queue
        await qres.ch.prefetch(3);

        let fn = app.callback();

        await qres.ch.consume(qres.q.queue, async(msg) => {
            fn({
                routerKey: "start",
                context: qres,
                params: {
                    msg: msg,
                    config: crawlerConfig
                }
            });
        }, {
            noAck: false
        });
    };

    return async(ctx, next) => {
        ctx.msg = ctx.params.msg;
        ctx.config = ctx.params.config;

        await next();
    };
};