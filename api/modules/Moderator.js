const mqtt = require("mqtt");

const defaultParams = {
    username: "anonymous",
    password: "anonymous"
};

const defaultPayload = {
    min: 0,
    max: 100
};

const defaultCallback = {
    onSuccess: () => {},
    onError: () => {}
}

export const Types = {
    POSITIVE_NUMBER: "POSITIVE_NUMBER",
    PERCENT: "PERCENT",
    ON_OFF: "ON_OFF",
    TEMPERATURE: "TEMPERATURE"
};

function onMessage(topic, payload) {
    if(topic === "sensor/event") {
        let message = JSON.parse(payload);
        if(message.token in this._ops) {
            if(typeof this._ops[message.token].onSuccess === "function" && message["success"])
                this._ops[message.token].onSuccess(message);
            else if(typeof this._ops[message.token].onError === "function" && !message["success"])
                this._ops[message.token].onError(message);
        }
    }
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

class Moderator {
    constructor(url, args) {
        this._args = Object.assign({}, defaultParams, args);

        this._client = mqtt.connect(url, {username: this._args.username, password:this._args.password});
        this._client.subscribe("sensor/event");

        this._ops = {};

        this._client.on("message", onMessage.bind(this));
        this._client.on("error", onError.bind(this));
        this._client.on("connect", onConnect.bind(this));
        this._client.on("reconnect", onReconnect.bind(this));
        this._client.on("offline", onOffline.bind(this));

    }

    createSensor(payload, callback = {}) {
        let token = Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);

        callback = Object.assign({}, defaultCallback, callback);

        let toSend = Object.assign({}, payload, defaultPayload);

        this._ops[token] = callback;

        this._client.publish("sensor/start", {
            token: token,
            toSend
        });

    }

    deleteSensor(sensorName, callback = {}) {
        let token = Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);

        callback = Object.assign({}, defaultCallback, callback);

        this._ops[token] = callback;

        this._client.publish("sensor/stop", {
            token: token,
            sensor: sensorName,
        });
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
        }
    }
}

export default Moderator;