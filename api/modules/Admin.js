const mqtt = require("mqtt");

const defaultParams = {
    username: "anonymous",
    password: "anonymous",
    async: false,
    timeout: 5000
};

export const Privilege = {
    ADMIN: 1,
    SIMULATOR: 2,
    MODERATOR: 3,
    CLIENT: 4
};

function onMessage(topic, payload) {
    if(topic === "admin/event") {
        let message = JSON.parse(payload);
        this._ops[message.token] = message["success"];
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

class Admin {
    constructor(url, args) {
        this._args = Object.assign({}, defaultParams, args);

        this._client = mqtt.connect(url, {username: this._args.username, password:this._args.password});
        this._client.subscribe("admin/event");

        this._ops = [];

        this._client.on("message", onMessage.bind(this));
        this._client.on("error", onError.bind(this));
        this._client.on("connect", onConnect.bind(this));
        this._client.on("reconnect", onReconnect.bind(this));
        this._client.on("offline", onOffline.bind(this));

    }

    createUser(username, password, privilege) {
        let token = Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);

        //noinspection JSUnresolvedFunction
        this._client.publish("admin/createUser", {
            token: token,
            username: username,
            password: password,
            privilege: privilege
        });

        if(!this._args.async) {
            let compteur = 0;
            while(compteur < this._args.timeout) {
                if(token in this._ops) {
                    let returned = this._ops[token];
                    delete this._ops[token];
                    return returned;
                }
            }
        }
    }

    deleteUser(username) {
        let token = Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);

        //noinspection JSUnresolvedFunction
        this._client.publish("admin/deleteUser", {
            token: token,
            username: username,
        });

        if(!this._args.async) {
            let compteur = 0;
            while(compteur < this._args.timeout) {
                if(token in this._ops) {
                    let returned = this._ops[token];
                    delete this._ops[token];
                    return returned;
                }
            }
        }
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

export default Admin;