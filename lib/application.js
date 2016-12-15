import compose from "koa-compose";
import { EventEmitter } from "events";
import _ from "lodash";
import { Context } from "./context";

let middlewares = [];

export class Application extends EventEmitter {
    constructor() {
        super();
    }

    use(fn) {
        if (!_.isFunction(fn)) {
            throw new TypeError("middleware must be a function！");
        }

        middlewares.push(fn);
    }

    create(server, config) {
        // const fn = this.callback();
        this.context = new Context(config);
        // this.context.eurecaServer.exports.echo = function(message) {
        //     let context = this;
        //     context.async = true;
        //     fn(message, context);
        // };
        this.context.server.attach(server);
    }

    callback() {
        const fn = compose(middlewares);
        const onerror = (err) => {
            this.emit("error", err);
        };

        return (opts, next) => {
            const ctx = _.extend({
                context: this.context
            }, opts);

            return fn(ctx, next);
        };
    }
}