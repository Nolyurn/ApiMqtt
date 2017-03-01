import { SensorCollection } from './sensors';
import mqtt from 'mqtt';

/**
 * Represents the simulator itself: opens an MQTT connection and provides
 * callbacks for the sensors/start and sensors/stop topics.
 */
export class SensorsSimulator {
    /**
     * Creates the simulator.
     * @param uri The broker's URI.
     * @param username The username for simulator privileges.
     * @param password The associated password.
     * @param announce_freq The announcement frequency.
     * @param retry_freq The connection retry interval.
     * @param topics The topic names to use (see app.js).
     */
    constructor(uri, username, password, announce_freq, retry_freq, topics) {
        this.sensors = new SensorCollection();
        this.announce_timer = null;
        this.announce_on = topics.announce;
        this.response = topics.response;

        this.subscriptions = {};
        this.subscriptions[topics.start] = this.start_sensor.bind(this);
        this.subscriptions[topics.stop] = this.stop_sensor.bind(this);

        /* Open a connection. */
        const that = this;

        console.log('Opening a connection to ' + uri + '...');
        this.uplink = mqtt.connect(uri, {
            username: username,
            password: password,
            reconnectPeriod: Math.round(retry_freq * 1000)
        });

        this.uplink.on('connect', function () {
            /* Schedule announcements. */
            console.log('Scheduling announcements every ' + announce_freq + 's.');
            that.announce_timer = setInterval(
                that.announce.bind(that),
                Math.round(announce_freq * 1000)
            );

            /* Subscribe to requests channels. */
            for (let sub of [topics.start, topics.stop]) {
                console.log('Ready on ' + sub + '.');
                that.uplink.subscribe(sub);
            }

            console.log('Broker connection established.');
        });

        this.uplink.on('close', function (error) {
            clearInterval(this.announce_timer);
            console.log('Failed to connect to the broker, ' +
                        'will try again in ' + retry_freq + 's (' + error + ')');
        });

        this.uplink.on('message', this.dispatch.bind(this));
    }

    /**
     * Handles all MQTT messages and calls the appropriate callbacks.
     * @param topic The topic on which the message was broadcast.
     * @param message The message's payload.
     */
    dispatch(topic, message) {
        let json_message = {};

        try {
            message = message.toString();
            json_message = JSON.parse(message);
        }
        catch(err) {
            console.log('Invalid request received (not a JSON payload) :', message);
            return;
        }

        /* Note: this will fail to dispatch messages if we subscribed using a
         * wildcard (eg. topic/#). For our use case it's not really a
         * problem. */
        for(let subscription in this.subscriptions)
            if(this.subscriptions.hasOwnProperty(subscription) &&
                topic === subscription)
                this.subscriptions[subscription](json_message);
    }

    /**
     * Announces the list of sensors regularly.
     */
    announce() {
        this.uplink.publish(this.announce_on, JSON.stringify(this.sensors.json()));
    }

    /**
     * Wrapper around all requests: handles tokens and error relaying.
     * @param payload The payload passed in the request.
     * @param op The actual operation to execute.
     */
    request_handler(payload, op) {
        if(!payload.hasOwnProperty('token')) {
            /* No token: request ignored. We can't identify it on sensors/response. */
            console.log('Invalid request received (missing token) : ' + JSON.stringify(payload));
            return;
        }

        try {
            /* Try to perform the request operation ; all ops should throw errors when unsuccessful. */
            op(payload);
            /* Emit a success response. */
            this.uplink.publish(this.response, JSON.stringify({
                'token': payload.token,
                'success': true
            }));
        }
        catch(err) {
            console.log(err);
            /* An error occurred: publish the error under the token on sensors/response. */
            this.uplink.publish(this.response, JSON.stringify({
                'token': payload.token,
                'success': false,
                'payload': err.message
            }));
        }
    }

    /**
     * Handles the creation of a new sensor.
     * @param payload A description of the new sensor.
     */
    start_sensor(payload) {
        let simulate = this.simulate.bind(this);
        this.request_handler(payload, (payload) => {
            this.sensors.add(payload, simulate);
        });
    }

    /**
     * Handles the deletion of an existing sensor.
     * @param payload An identified for the sensor.
     */
    stop_sensor(payload) {
        this.request_handler(payload, (payload) => {
            this.sensors.remove(payload);
        });
    }

    /**
     * Simulates a sensor once. This function is scheduled using setInterval.
     * @param sensor The sensor to be simulated.
     */
    simulate(sensor) {
        this.uplink.publish(sensor.topic(), JSON.stringify({'value': sensor.value(), 'type': sensor.type}));
    }
}
