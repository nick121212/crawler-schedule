import crawlerConfig from "./keyfiles/yaolan";
import mainApp from "./apps/main";
import spa from "nspa";

const config = spa.configFile();

mainApp(config, crawlerConfig);

process.on("unhandledRejection", function(reason) {
    console.log("Unhandled Rejection at: Promise", reason);
});