import { Server } from "eureca.io";
import { EventEmitter } from "events";
import _ from "lodash";

const connections = {};
export class Context extends EventEmitter {
    constructor(config) {
        super();
        this.init(config);
    }

    getOne() {
        return _.first(_.filter(this.connections, (conn) => {
            return !conn.busy
        }));
    }

    init(config) {
        this.server = new Server({
            transport: config.transport,
            allow: config.allow
        });
        this.connections = connections;
        this.server.on("connect", (connection) => {
            connection.clientProxy.status().onReady((result) => {
                this.connections[connection.id] = {
                    busy: result,
                    socket: connection,
                    client: connection.clientProxy
                };
            });
        });
        this.server.exports.setStatus = function(status) {
            let connection = this;
            let clientId = connection.user.clientId;

            if (connections[clientId]) {
                connections[clientId].busy = status;
                connection.return(true);
            }
        }
        this.server.on("disconnect", (connection) => {
            this.emit("disconnect", connection.id);
            delete this.connections[connection.id];
        });
        // this.server.on("error", (message, connection) => {
        //     let client = this.server.getClient(connection.id);
        //     client.disconnect();
        //     this.emit("contextError", new Error(message));
        // });
    }


}