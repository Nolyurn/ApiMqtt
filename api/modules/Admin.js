const mqtt = require("mqtt");

/**
 * Default usernames when not specified to constructor
 * @type {{username: string, password: string, adminTopic: string, adminCreateTopic: string, adminDeleteTopic: string, adminEventTopic: string}}
 */
const defaultParams = {
    username: "anonymous",
    password: "anonymous",
    adminTopic: "admin",
    adminCreateTopic: "create",
    adminDeleteTopic: "delete",
    adminEventTopic: "event"
};

/**
 * Privilege levels
 * @type {{ADMIN_USER: string, SIMULATOR: string, MODERATOR: string, USER: string}}
 */
export const Privilege = {
    ADMIN_USER : "ADMIN_USER",
    MODERATOR : "MODERATOR",
    USER : "USER"
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
 * Callback method fired to redirect validation tokens.
 * @param topic {string} The topic of incoming message
 * @param payload {ArrayBuffer} Incoming data
 */
function onMessage(topic, payload) {
    if(topic === this._args.adminTopic + "/" + this._args.adminEventTopic) {
        let message = JSON.parse(payload);
        if(message.token in this._ops) {
            if(typeof this._ops[message.token].onSuccess === "function" && message["success"]){
                this._ops[message.token].onSuccess(message);
            }
            else if(typeof this._ops[message.token].onError === "function" && !message["success"]){
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
 * Client object for an administration usage
 */
class Admin {

    /**
     * An admin-privileged client.
     * @constructor
     * @param url {string} The URL of our custom broker
     * @param args {Object} Parameters to our client.
     *                      - username {string} (default : "anonymous")
     *                      - password {string} (default : "anonymous")
     *                      - adminEventTopic {string} (default : "admin")
     */
    constructor(url, args) {
        this._args = Object.assign({}, defaultParams, args);

        this._client = mqtt.connect(url, {username: this._args.username, password:this._args.password});
        this._client.subscribe(this._args.adminTopic + "/" + this._args.adminEventTopic);

        this._ops = {};

        this._client.on("message", onMessage.bind(this));
        this._client.on("error", onError.bind(this));
        this._client.on("connect", onConnect.bind(this));
        this._client.on("reconnect", onReconnect.bind(this));
        this._client.on("offline", onOffline.bind(this));
    }

    /**
     * Sends a command to the broker to create a new user with given parameters.
     * We're based on TLS/HTTPS to encrypt the request.
     * @param username {string} The desired username
     * @param password {string} The desired password
     * @param privilege {string} The desired privilege. It can be :
     *                           - Privilege.ADMIN_USER
     *                           - Privilege.MODERATOR
     *                           - Privilege.USER
     * @param callback {Object} Object including the callbacks on error and success or the operation.
     *                          Should including onSuccess and onError attributes.
     */
    createUser(username, password, privilege, callback = {}) {
        let token = Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
        callback = Object.assign({}, defaultCallback, callback);
        this._ops[token] = callback;

        this._client.publish(this._args.adminTopic + "/" + this._args.adminCreateTopic, JSON.stringify({
            token: token,
            username: username,
            password: password,
            privilege: privilege
        }));
    }

    /**
     * Sends a command to the broker to delete the user.
     * @param username {string} The account's username to delete
     * @param callback {Object} Object including the callback on error and success or the operation.
     *                          Should including onSuccess and onError attributes.
     */
    deleteUser(username, callback = {}) {
        let token = Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
        callback = Object.assign({}, defaultCallback, callback);
        this._ops[token] = callback;

        this._client.publish(this._args.adminTopic + "/" + this._args.adminDeleteTopic, JSON.stringify({
            token: token,
            username: username,
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

export default Admin;