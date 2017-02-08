import { format } from 'util';

const ErrorMessage = Object.freeze({
    TYPELESS: 'an abstract type was instantiated',
    INVALID_TYPE: 'invalid or unknown sensor type',
    INVALID_PARAM: 'missing or invalid type parameter: %s',
    MISSING_UNIT: 'missing or invalid unit (expected C or F)',
    MINMAX_INCOHERENCE: 'incoherence between min and max (min > max)'
});

class TypeError extends Error {
    /**
     * Custom error type for typing.
     * @param message
     */
    constructor(message) {
        super(message);
        this.name = 'TypeError';
        this.message = message || 'unknown type error';
    }
}

class SensorDataType {
    /**
     * Base constructor for all data types.
     * @param params A JSON payload containing the type's parameters.
     */
    constructor(params) {
        this.params = params;
    }

    /**
     * @returns {string} A string type identifier.
     */
    static id() {
        throw new TypeError(ErrorMessage.TYPELESS);
    }

    /**
     * @returns {*} A random value for the type.
     */
    value() { throw new TypeError(ErrorMessage.TYPELESS); }

    /**
     * @returns {{id: string}} The type as a JSON payload.
     */
    json() { return {'id': this.id()} }
}

class RandFloat extends SensorDataType {
    static id() { return 'RAND_FLOAT'; }
    value() { return Math.random(); }
}

class RandInt extends RandFloat {
    static id() { return 'RAND_INT'; }

    constructor(params) {
        super(params);

        for(let key of ['min', 'max'])
            if(!this.params.hasOwnProperty(key))
                throw new TypeError(format(ErrorMessage.INVALID_PARAM, key));

        let ints = {
            min: parseFloat(params.min),
            max: parseFloat(params.max)
        };

        for(let key of ['min', 'max'])
            if(isNaN(params[key]) || isNaN(params[key]) || ints[key] % 1 !== 0 || ints[key] % 1 !== 0)
                throw new TypeError(format(ErrorMessage.INVALID_PARAM, key));

        this.min = Math.trunc(ints.min);
        this.max = Math.trunc(ints.max);

        if(this.min > this.max)
            throw new TypeError(ErrorMessage.MINMAX_INCOHERENCE);
    }

    value() {
        return Math.floor(super.value() * (this.max - this.min + 1) + this.min);
    }

    json() {
        let payload = super.json();
        payload.min = this.min;
        payload.max = this.max;
        return payload;
    }
}

class RandBoolean extends RandFloat {
    static id() { return 'RAND_BOOLEAN'; }
    value() { return super.value() < 0.5; }
}

class OnOff extends RandBoolean {
    static id() { return 'ON_OFF'; }
    value() { return super.value() < 0.5 ? 'ON' : 'OFF'; }
}

class OpenClose extends RandBoolean {
    static id() { return 'OPEN_CLOSE'; }
    value() { return super.value() < 0.5 ? 'OPEN' : 'CLOSE'; }
}

class RoomTemperature extends RandInt {
    static id() { return 'ROOM_TEMPERATURE'; }

    constructor(params) {
        if(!params.hasOwnProperty('unit') || params.unit !== 'C' && params.unit !== 'F')
            throw new TypeError(ErrorMessage.MISSING_UNIT);

        super({
            min: params.unit === 'C'  ? 17 : 62,
            max: params.unit === 'C' ? 28 : 82
        });

        this.unit = params.unit;
    }

    json() {
        let payload = super.json();
        payload.unit = this.unit;
        return payload;
    }
}

/**
 * Returns a sensor type class based on a string ID.
 * @param id A type identifier.
 * @returns {*} A SensorDataType subclass.
 */
export default function find_type(id) {
    let classes = [RandFloat, RandInt, RandBoolean, OnOff, OpenClose, RoomTemperature];
    for(let cls of classes)
        if(cls.id() === id)
            return cls;
    throw new TypeError(ErrorMessage.INVALID_TYPE);
}
