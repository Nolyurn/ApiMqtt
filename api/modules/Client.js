let mqtt = require("mqtt");

let defaultParams = {
    username: "anonymous",
    password: "anonymous",
    async: false,
};

function onMessage() {

}

function onError() {

}

function onDisconnect() {

}

class Client {
    constructor() {
        this.client = null;

        this.client.on("message", onMessage.bind(this));

        this.onConnect = null;
        this.onReconnect = null;
        this.onDisconnect = null;
        this.onOffline = null;
        this.onError = null;
        this.onMessage = null;



    }

    connect(url, argument) {

    }
}

export default Client;