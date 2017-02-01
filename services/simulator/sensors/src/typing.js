import format from 'util';

const ErrorMessage = Object.freeze({
    TYPELESS: 'an abstract type was instantiated',
    INVALID_TYPE: 'invalid sensor type: %s',
    INVALID_PARAM: 'missing or invalid type parameter: %d',
    MISSING_UNIT: 'missing unit'
});

class TypeError extends Error {
    /**
     * Custom error type for typing.
     * @param message
     */
    constructor(message) {
        this.name = 'TypeError';
        this.message = message || 'unknown type error';
        this.stack = (new Error()).stack;
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
            if(!self.params.hasOwnProperty(key) || isNaN(self.params[key]))
                throw new TypeError(format(ErrorMessage.INVALID_PARAM, key));

        self.min = parseInt(params.min, 10);
        self.max = parseInt(params.max, 10);
    }

    value() {
        return Math.floor(super.value() * (self.max - self.min + 1) + self.min);
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
        if(!params.hasOwnProperty('unit'))
            throw TypeError(ErrorMessage.MISSING_UNIT);

        super({
            min: params.unit == 'C'  ? 17 : 62,
            max: params.unit == 'C' ? 28 : 82
        });
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
