import spa from "nspa";
import connMiddle from "../middlewares/connection";
import callFuncMiddle from "../middlewares/callfunc";

export default (config, crawlerConfig, connections) => {
    let initilize = false;
    const app = new spa.Compose();

    app.onError = (err) => {
        console.log(err);
    };

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
    app.use(connMiddle(connections));
    app.use(callFuncMiddle({ timeout: 15000 }));
    app.use(async(ctx, next) => {
        if (ctx.result.storeResultUrls) {
            initilize = true;
        }
        await next();
    });
    app.onComplete = () => {
        call();
    };

    call();
};