import boom from "boom";
import _ from "lodash";
import { callFunc } from "./callfunc";

export default (connections) => {
    return async(ctx, next) => {
        let conns = _.sortBy(_.filter(connections, (conn) => {
            return conn.jobs > 1;
        }), "jobs");

        let conn = _.first(conns);

        if (conn) {
            let result = await callFunc(conn, {}, "status", { timeout: 10000 });

            if (result.jobs > 1) {
                ctx.conn = conn;
                await next();
            } else {
                throw boom.create(607, "没有空闲的爬虫！");
            }
        } else {
            throw boom.create(607, "没有空闲的爬虫！");
        }
    };
};