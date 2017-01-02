import mqtt from 'mqtt';

/**
 * Handles the connection to an MQTT broker, and dispatches messages to
 * different callbacks based on topic value.
 */
export class MQTTConnection {
    /**
     * Opens a connection.
     * @param uri The server's URI (eg. mqtt://localhost).
     * @param username The username used for authentication.
     * @param password The associated password.
     * @param subscriptions An object with topic: callback entries.
     */
    constructor(uri, username, password, subscriptions = {}) {
        this.subscriptions = subscriptions;
        this.uplink = mqtt.connect(uri, {
            username: username,
            password: password
        });

        const uplink = this.uplink;
        uplink.on('connect', function () {
            /* Subscribe to all requested topics. */
            for(let sub of Object.keys(subscriptions))
                uplink.subscribe(sub);
        });

        uplink.on('error', function(error) {
            throw new Error("Cannot connect to the MQTT server: " + error);
        });

        uplink.on('message', this.dispatch.bind(this));
        this.publish = this.publish.bind(this);
    }

    /**
     * Handles all MQTT messages and calls the appropriate callbacks.
     * @param topic The topic on which the message was broadcast.
     * @param message The message's payload.
     */
    dispatch(topic, message) {
        /* Note: this will fail to dispatch messages if we subscribed using a
         * wildcard (eg. topic/#). For our use case it's not really a
         * problem. */
        for(let subscription in this.subscriptions)
            if(this.subscriptions.hasOwnProperty(subscription) &&
                topic === subscription)
                this.subscriptions[subscription](message);
    }

    /**
     * Publishes a message on a given topic.
     * @param topic The topic.
     * @param payload The payload.
     */
    publish(topic, payload) {
        this.uplink.publish(topic, payload);
    }
}
