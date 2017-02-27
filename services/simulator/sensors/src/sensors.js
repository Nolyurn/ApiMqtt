import { format } from 'util';
import find_type from './typing';

const ErrorMessage = Object.freeze({
    INVALID_PAYLOAD: 'missing or invalid key in sensor payload: %s',
    FREQUENCY_LIMIT: 'frequency is too low (should be >= 1)',
    NAME_TAKEN: 'sensor name is already in use'
});

class SensorError extends Error {
    /**
     * Custom error type for sensors.
     * @param message
     */
    constructor(message) {
        super(message);
        this.name = 'SensorError';
        this.message = message || 'unknown sensor error';
    }
}

class Sensor {
    /**
     * Creates the sensor from a user payload.
     * @param payload The user payload.
     */
    constructor(payload) {
        let base_checks = [
            {param: 'name', check: (v) => (typeof(v) === 'string' || v instanceof String) && v.length > 1},
            {param: 'type', check: (v) => typeof(v) === 'object' && v.hasOwnProperty('id')},
            {param: 'frequency', check: (v) => !isNaN(v)}
        ];

        /* Basic checks on properties. */
        for(let item of base_checks)
            if(!payload.hasOwnProperty(item.param) || !item.check(payload[item.param]))
                throw new SensorError(format(ErrorMessage.INVALID_PAYLOAD, item.param));

        this.name = payload.name;
        this.frequency = parseFloat(payload.frequency);
        this.timer = null;

        /* Frequency limit: 1 per second, at least. */
        if(this.frequency < 1) throw new SensorError(ErrorMessage.FREQUENCY_LIMIT);

        /* Type identification: this will throw errors when needed. */
        let sensor_type = find_type(payload.type.id);
        this.type = new sensor_type(payload.type);
    }

    /**
     * Sets a timer to simulate this sensor.
     * @param callback The simulator's callback.
     */
    schedule(callback) {
        this.timer = setInterval(callback, Math.round(this.frequency * 1000), this);
    }

    /**
     * Returns the sensor as a JSON payload for announcements.
     * @returns {{name: *, frequency: (Number|*), type: ({name, frequency, type}|*)}}
     */
    json() {
        return {
            'name': this.name,
            'frequency': this.frequency,
            'type': this.type.json()
        }
    }

    topic() { return 'value/' + this.name; }
    value() { return this.type.value(); }
}

export class SensorCollection {
    /**
     * Creates an empty sensors collection.
     */
    constructor() {
        this.sensors = [];
        this.add = this.add.bind(this);
        this.remove = this.remove.bind(this);
        this.json = this.json.bind(this);
    }

    /**
     * Adds a payload to the collection and sets a callback for simulation scheduling (timer).
     * @param payload
     * @param callback
     */
    add(payload, callback) {
        for(let sensor of this.sensors)
            if(sensor.name == payload.name)
                throw new SensorError(format(ErrorMessage.NAME_TAKEN, payload.name));

        let sensor = new Sensor(payload);
        sensor.schedule(callback);
        this.sensors.push(sensor);
    }

    /**
     * Removes a sensor based on a payload.
     * @param payload A user payload with a name attribute.
     */
    remove(payload) {
        if(!payload.hasOwnProperty('name'))
            throw new SensorError(format(ErrorMessage.INVALID_PAYLOAD, 'name'));
        this.sensors = this.sensors.filter((i, e) => payload.name === e.name);
    }

    /**
     * Creates a JSON payload for the entire collection.
     * @returns {Array} The JSON payload.
     */
    json() {
        let payload = [];
        for(let sensor of this.sensors)
            payload.push(sensor.json());
        return payload;
    }
}
