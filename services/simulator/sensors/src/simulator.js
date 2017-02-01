import { MQTTConnection } from './mqtt';
import { SensorCollection } from './sensors';

/**
 * Represents the simulator itself: opens an MQTT connection and provides
 * callbacks for the sensors/start and sensors/stop topics.
 */
export class SensorsSimulator {
    /**
     * Creates the simulator.
     * @param uri (see mqtt.js)
     * @param username (see mqtt.js)
     * @param password (see mqtt.js)
     * @param start_topic The topic on which simulation requests are made.
     * @param stop_topic The topic on which simulation requests are cancelled.
     */
    constructor(uri, username, password, start_topic, stop_topic, event_topic) {
        let subscriptions = {};
        subscriptions[start_topic] = this.start_sensor.bind(this);
        subscriptions[stop_topic] = this.stop_sensor.bind(this);

        this.events = event_topic;
        this.uplink = new MQTTConnection(uri, username, password, subscriptions);
        this.sensors = new SensorCollection();
    }

    /**
     * Wrapper around all requests: handles tokens and error relaying.
     * @param payload The payload passed in the request.
     * @param op The actual operation to execute.
     */
    request_handler(payload, op) {
        if(!payload.hasOwnProperty('token'))
            /* No token: request ignored. We can't identify it on sensors/event. */
            return;

        try {
            /* Try to perform the request operation ; all ops should throw errors when unsuccessful. */
            op(payload);
            /* Emit a success event. */
            this.uplink.publish(this.events, {'token': payload.token, 'status': 1});
        }
        catch(err) {
            /* An error occurred: publish the error under the token on sensors/event. */
            this.uplink.publish(this.events, {'token': payload.token, 'status': 0, payload: err.message});
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
        this.uplink.publish(sensor.topic(), {'value': sensor.value(), 'type': sensor.type});
    }
}
