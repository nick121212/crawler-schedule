import { esFunc } from "crawler-common";
import boom from "boom";

export default async(config) => {
    const client = esFunc(config);

    return async(ctx, next) => {
        let msgInfo = JSON.parse(ctx.msg.content.toString());

        let res = await client.get({
            index: msgInfo._index,
            type: msgInfo._type,
            id: msgInfo._id
        });

        if (res && res.found && res._source.url) {
            ctx.queueItem = res._source;
            await next();
        } else {
            throw boom.create(608, "queueInfo错误");
        }
    };
};