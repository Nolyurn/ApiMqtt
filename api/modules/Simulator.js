const mqtt = require("mqtt");

/**
 * Default usernames when not specified to constructor
 * @type {{username: string, password: string}}
 */
const defaultParams = {
    username: "anonymous",
    password: "anonymous"
};

/**
 * Callback method fired to redirect validation tokens.
 * @param topic {string} The topic of incoming message
 * @param payload {ArrayBuffer} Incoming data
 */
function onMessage(topic, payload) {
    let message = JSON.parse(payload);

    if(topic === "sensor/start" && typeof this._onCreate === "function") {
        this._onCreate(topic, message);
    }
    else if(topic === "sensor/stop" && typeof this._onDelete === "function") {
        this._onDelete(topic, message);
    }
}

/**
 * Callback method fired when the client cannot connect or when a parsing error occurs.
 * @param error The emitted error
 */
function onError(error) {
    if(typeof this._onError === "function") {
        this._onError(error);
    }
}

/**
 * Emitted on successful (re)connection
 * @param connack Received connack packet.
 */
function onConnect(connack) {
    if(typeof this._onConnect === "function") {
        this._onConnect(connack);
    }
}

/**
 * Emitted when a reconnect starts.
 */
function onReconnect() {
    if(typeof this._onReconnect === "function") {
        this._onReconnect();
    }
}

/**
 * Emitted when the client goes offline.
 */
function onOffline() {
    if(typeof this._onOffline === "function") {
        this._onOffline();
    }
}

/**
 * Client object to get simulator creation requests, and send simulated sensors value.
 */
class Simulator {
    /**
     * A simulator priviledge object
     * @constructor
     * @param url URL of the Broker.
     * @param args {Object} Parameters to our client.
     *                      - username (default : anonymous)
     *                      - password (default : anonymous)
     */
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

    /**
     * Specifies callback on message received from the broker
     * @param event {string} Type of event to catch
     * @param callback {function} Callback when event happens
     */
    on(event, callback) {
        switch(event) {
            case "error" :
                this._onError = callback;
                break;
            case "connect" :
                this._onConnect = callback;
                break;
            case "reconnect" :
                this._onReconnect = callback;
                break;
            case "offline" :
                this._onOffline = callback;
                break;
            case "create" :
                this._onCreate = callback;
                break;
            case "delete" :
                this._onDelete = callback;
                break;
        }
    }
}

export default Simulator;