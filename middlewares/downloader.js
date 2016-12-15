import boom from "boom";

export default (config) => {
    const startCrawler = (conn, params) => {
        let timeId = 0;
        return new Promise((resolve, reject) => {
            conn.client.start(params).onReady((result) => {
                resolve(result);
                clearTimeout(timeId);
            });

            timeId = setTimeout(function() {
                reject(boom.clientTimeout(conn.socket.id + "--" + params.queueItem.url + "--timeout"));
            }, config.timeout || 10000);
        });
    }

    return async(ctx, next) => {
        let conn = ctx.context.getOne();
        let queueItem = JSON.parse(ctx.msg.content.toString());

        ctx.queueItem = queueItem;
        if (conn) {
            ctx.conn = conn;
            ctx.result = await startCrawler(conn, {
                queueItem: queueItem,
                config: ctx.config
            });
            await next();
        } else {
            throw boom.create("607", ctx.queueItem.url + "没有空闲的爬虫！");
        }
    };
}