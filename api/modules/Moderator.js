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
 * Default values for required parameters when a new sensor is created
 * @type {{min: number, max: number}}
 */
const defaultPayload = {
    min: 0,
    max: 100
};

/**
 * Default callbacks when not specified to operations
 * @type {{onSuccess: (()), onError: (())}}
 */
const defaultCallback = {
    onSuccess: () => {},
    onError: () => {}
};

/**
 * Sensors types
 * @type {{POSITIVE_NUMBER: string, PERCENT: string, ON_OFF: string, TEMPERATURE: string}}
 */
export const Types = {
    POSITIVE_NUMBER: "POSITIVE_NUMBER",
    PERCENT: "PERCENT",
    ON_OFF: "ON_OFF",
    TEMPERATURE: "TEMPERATURE"
};

/**
 * Callback method fired to redirect validation tokens.
 * @param topic {string} The topic of incoming message
 * @param payload {ArrayBuffer} Incoming data
 */
function onMessage(topic, payload) {
    if(topic === "sensor/event") {
        let message = JSON.parse(payload);
        if(message.token in this._ops) {
            if(typeof this._ops[message.token].onSuccess === "function" && message["success"]) {
                this._ops[message.token].onSuccess(message);
            }
            else if(typeof this._ops[message.token].onError === "function" && !message["success"]) {
                this._ops[message.token].onError(message);
            }
        }
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
 * Client object for sensors-creating privileged user.
 */
class Moderator {

    /**
     * A sensors-creating-privileged client.
     * @constructor
     * @param url {string} The URL of our custom broker
     * @param args {Object} Parameters to our client.
     *                      - username (default : anonymous)
     *                      - password (default : anonymous)
     */
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

    /**
     * Send a payload to the broker in order to begin the simulation of a new sensor.
     * @param payload {object} Parameters for the sensor creation :
     *                         - request : "create" or "delete"
     *                         - type : The sensor type (see Types),
     *                         - min : The minimum value of the random value sent by the simulator
     *                         - max : The maximum value of the random value sent by the simulator
     *                         - interval : Number of values by second.
     *                         - token : "fkFIfjrk5fR"
     * @param callback {Object} Object including the callbacks on error and success or the operation.
     *                          Should including onSuccess and onError attributes.
     */
    createSensor(payload, callback = {}) {
        let token = Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);

        callback = Object.assign({}, defaultCallback, callback);

        let toSend = Object.assign({}, defaultPayload, payload, {token : token});

        this._ops[token] = callback;

        this._client.publish("sensor/start", JSON.stringify(toSend));

    }

    /**
     * Deletes the sensor in parameter.
     * @param sensorName The sensor to delete
     * @param callback {Object} Object including the callbacks on error and success or the operation.
     *                          Should including onSuccess and onError attributes.
     */
    deleteSensor(sensorName, callback = {}) {
        let token = Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);

        callback = Object.assign({}, defaultCallback, callback);

        this._ops[token] = callback;

        this._client.publish("sensor/stop", JSON.stringify({
            token: token,
            sensor: sensorName,
        }));
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
        }
    }

    end(){
        this._client.end();
    }

}

export default Moderator;