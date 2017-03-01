import spa from "nspa";
import connMiddle from "../middlewares/connection";
import callFuncMiddle from "../middlewares/callfunc";

export default (config, crawlerConfig, connections) => {
    let initilize = false;
    const app = new spa.Spa();

    const call = () => {
        if (!initilize) {
            setTimeout(() => {
                app.callback()({
                    config: crawlerConfig,
                    routerKey: "init",
                    context: {}
                });
            }, 1000);
        }
    };
    app.use(async(ctx, next) => {
        await next();
        call();
    });
    app.use(connMiddle(connections));
    app.use(callFuncMiddle({ timeout: 15000 }));
    app.use(async(ctx, next) => {
        if (ctx.result.storeResultUrls) {
            initilize = true;
        }
        await next();
    });

    call();
};