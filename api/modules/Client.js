const mqtt = require("mqtt");

const defaultParams = {
    username: "anonymous",
    password: "anonymous"
};

function onMessage(topic, payload) {
    if(typeof this._onMessage === "function") {
        this._onMessage(topic, JSON.parse(payload));
    }

    let topicTemp = topic.split("/", 2)[1];

    if(typeof this._subs[topicTemp] === "function") {
        this._subs[topicTemp](topic, JSON.parse(payload));
    }
}

function onError(error) {
    if(typeof this._onError === "function") {
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

class Client {
    constructor(url, args) {
        this._args = Object.assign({}, defaultParams, args);
        this._subs = {};

        this._client = mqtt.connect(url, {username: this._args.username, password:this._args.password});

        this._client.on("message", onMessage.bind(this));
        this._client.on("error", onError.bind(this));
        this._client.on("connect", onConnect.bind(this));
        this._client.on("reconnect", onReconnect.bind(this));
        this._client.on("offline", onOffline.bind(this));

    }

    subscribe(topic, callback = () => {}){
        this._client.subscribe("value/" + topic);
        this._subs[topic] = callback;
    }

    on(event, func) {
        switch(event) {
            case "message" :
                this._onMessage = func;
                break;
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
        }
    }
}

export default Client;