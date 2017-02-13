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
 * Callback method fired when a message comes from a subscribe topic.
 * If a callback function exists for the topic, the function fires it.
 * @param topic {string} The topic of incoming message
 * @param payload {ArrayBuffer} Incoming data
 */
function onMessage(topic, payload) {
    if(typeof this._onMessage === "function") {
        this._onMessage(topic, JSON.parse(payload));
    }

    let topicTemp = topic.split("/", 2)[1];

    if(typeof this._subs[topicTemp] === "function") {
        this._subs[topicTemp](topic, JSON.parse(payload));
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
 * Client object made to catch values on subscribed sensors.
 */
class Client {
    /**
     * A basic-privilege client.
     * @constructor
     * @param url {string} The URL of our custom broker
     * @param args {Object} Parameters to our client.
     *                      - username (default : anonymous)
     *                      - password (default : anonymous)
     */
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

    /**
     * Subcribes to a topic under `value`.
     * @param topic {string} The name of the topic under `value`.
     * @param callback {function} The fired function when a message comes from this topic
     */
    subscribe(topic, callback = () => {}){
        this._client.subscribe("value/" + topic);
        this._subs[topic] = callback;
    }

    /**
     * Unsubscribes from this topic
     * @param topic {string} The topic to unsubcribe to
     */
    unsubscribe(topic) {
        this._client.unsubscribe(topic);
        delete this._subs[topic];
    }
    
    /**
     * Specifies callback on message received from the broker
     * @param event {string} Type of event to catch
     * @param callback {function} Callback when event happens
     */
    on(event, callback) {
        switch(event) {
            case "message" :
                this._onMessage = callback;
                break;
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

export default Client;