const mqtt = require("mqtt");

const defaultParams = {
    username: "anonymous",
    password: "anonymous"
};

function onMessage(topic, payload) {
    let message = JSON.parse(payload);

    if(topic === "sensor/start" && typeof this._onCreate === "function")
        this._onCreate(topic, message);
    else if(topic === "sensor/stop" && typeof this._onDelete === "function")
        this._onDelete(topic, message);
}

function onError(error) {
    if(typeof this._onMessage === "function") {
        this._onError(error);
    }
}

function onConnect(connack) {
    if(typeof this._onConnect === "function") {
        this._onConnect(connack);
    }
}

function onReconnect() {
    if(typeof this._onReconnect === "function") {
        this._onReconnect();
    }
}

function onOffline() {
    if(typeof this._onOffline === "function") {
        this._onOffline();
    }
}

class Simulator {
    constructor(url, args) {
        this._args = Object.assign({}, defaultParams, args);

        this._client = mqtt.connect(url, {username: this._args.username, password:this._args.password});
        this._client.subscribe("sensor/start");
        this._client.subscribe("sensor/stop");

        this._client.on("message", onMessage.bind(this));
        this._client.on("error", onError.bind(this));
        this._client.on("connect", onConnect.bind(this));
        this._client.on("reconnect", onReconnect.bind(this));
        this._client.on("offline", onOffline.bind(this));

    }

    on(event, func) {
        switch(event) {
            case "error" :
                this._onError = func;
                break;
            case "connect" :
                this._onConnect = func;
                break;
            case "reconnect" :
                this._onReconnect = func;
                break;
            case "offline" :
                this._onOffline = func;
                break;
            case "create" :
                this._onCreate = func;
                break;
            case "delete" :
                this._onDelete = func;
                break;
        }
    }
}

export default Simulator;