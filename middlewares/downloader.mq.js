import _ from "lodash";
import { mqFunc } from "../../crawler-common";

export default async(config, queueConfig) => {
    let mq = await mqFunc(config);
    let qres = await mq.getQueue(queueConfig);

    return async(next) => {
        // 绑定路由到queue
        await qres.ch.bindQueue(qres.q.queue, "amq.topic", `${qres.q.queue}.urls`);
        // 每次消费1条queue
        await qres.ch.prefetch(3);
        await qres.ch.consume(qres.q.queue, async(msg) => {
            next(qres, msg);
        }, {
            noAck: false
        });
    }
}