import { MQTTConnection } from './mqtt';

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
    constructor(uri, username, password, start_topic, stop_topic) {
        let subscriptions = {'value/#': this.start_sensor.bind(this)};
        subscriptions[start_topic] = this.start_sensor.bind(this);
        subscriptions[stop_topic] = this.stop_sensor.bind(this);

        this.uplink = new MQTTConnection(uri, username, password, subscriptions);
        this.sensors = [];
    }

    /**
     * Handles the creation of a new sensor.
     * @param payload A description of the new sensor.
     */
    start_sensor(payload) {
        for (let key of ['name', 'type', 'freq'])
            if (!payload.hasOwnProperty(key))
                // TODO: error handling: invalid payload.
                return;

        for (let sensor of this.sensors)
            if (sensor.name == payload.name)
                // TODO: error handling: sensor already exists.
                return;

        let frequency = parseFloat(payload.freq);
        if(isNan(frequency) || frequency <= 0)
            // TODO: error handling: invalid frequency (+mplement limits).
            return;

        payload.timer = setInterval(this.simulate.bind(this), Math.round(frequency * 1000), payload);
        this.sensors.push(payload);
    }

    /**
     * Handles the deletion of an existing sensor.
     * @param payload An identified for the sensor.
     */
    stop_sensor(payload) {
        if (!payload.hasOwnProperty('name'))
            // TODO: error handling: invalid payload.
            return;

        for (let i = this.sensors.length - 1; i >= 0; i--) {
            if (payload.name == this.sensors[i].name) {
                this.sensors.slice(i, 1);
                clearInterval(payload.timer);
            }
        }
    }

    /**
     * Simulates a sensor once. This function is scheduled using setInterval.
     * @param sensor The sensor to be simulated.
     */
    simulate(sensor) {
        let topic = "value/" + sensor.name;
        let value = null;

        switch (sensor.type) {
            case 'POSITIVE_NUMBER':
                value = Math.random();
                break;
            case 'PERCENT':
                value = Math.floor(101 * Math.random());
                break;
            case 'ON_OFF':
                value = Math.random() < 0.5 ? 'ON' : 'OFF';
                break;
            case 'OPEN_CLOSE':
                value = Math.random() < 0.5 ? 'OPEN' : 'CLOSE';
                break;
            default:
                return;
        }

        this.uplink.publish(topic, {'value': value, 'type': sensor.type});
    }
}
