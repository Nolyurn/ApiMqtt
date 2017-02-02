import expect from 'expect';

process.env.BROKER_HOST = "";
process.env.AUTH_USER = "";
process.env.AUTH_PASS = "";

import { SensorCollection } from '../src/sensors.js';

var sensors = new SensorCollection("");

describe('Sensors test', () => {
    afterEach(() =>{
        sensors.sensors = []; //clear to avoid side-effects on other tests
    });
    describe('add sensor errors', () => {
        it("Missing property 'name' in payload", () => {
            var payload = {};
            expectAddSensorError(payload, "missing or invalid key in sensor payload: name");
            expect(sensors.sensors.length).toBe(0);
        });
        it("Missing property 'type' in payload", () => {
            var payload = {name:"sensname"};
            expectAddSensorError(payload, "missing or invalid key in sensor payload: type");
            expect(sensors.sensors.length).toBe(0);
        });
        it("Missing property 'freq' in payload", () => {
            var payload = {name:"sensname", type:{id:"ROOM_TEMPERATURE", unit:"C"}};
            expectAddSensorError(payload, "missing or invalid key in sensor payload: freq");
            expect(sensors.sensors.length).toBe(0);
        });
        it("Name property is badly set to number", () => {
            var payload = {name:12, type:{id:"ROOM_TEMPERATURE", unit:"C"}, freq:"mistake"};
            expectAddSensorError(payload, "missing or invalid key in sensor payload: name");
            expect(sensors.sensors.length).toBe(0);
        });
        it("Freq property is badly set to text", () => {
            var payload = {name:"sensname", type:{id:"ROOM_TEMPERATURE", unit:"C"}, freq:"mistake"};
            expectAddSensorError(payload, "missing or invalid key in sensor payload: freq");
            expect(sensors.sensors.length).toBe(0);
        });
        it("Freq property is badly set to negative number", () => {
            var payload = {name:"sensname", type:{id:"ROOM_TEMPERATURE", unit:"C"}, freq:-1};
            expectAddSensorError(payload, "frequency is too low (should be >= 1)");
            expect(sensors.sensors.length).toBe(0);
        });
        it("Freq property is badly set to zero", () => {
            var payload = {name:"sensname", type:{id:"ROOM_TEMPERATURE", unit:"C"}, freq:0};
            expectAddSensorError(payload, "frequency is too low (should be >= 1)");
            expect(sensors.sensors.length).toBe(0);
        });
        it("Type property is invalid", () => {
            var payload = {name:"sensname", type:{id:"OUPS"}, freq:0};
            expectAddSensorError(payload, "invalid sensor type: OUPS");
            expect(sensors.sensors.length).toBe(0);
        });
        it("Sensor name already used", () => {
            var payload = {name:"sensname", type:{id:"ROOM_TEMPERATURE", unit:"C"}, freq:1};
            expect(sensors.sensors.length).toBe(0);
            sensors.add(payload);
            expect(sensors.sensors.length).toBe(1);
            expectAddSensorError(payload, "sensor name sensname is already is use");
            expect(sensors.sensors.length).toBe(1);
        });
        it("Accepted payload", () => {
            var payload = {name:"sensname", type:{id:"ROOM_TEMPERATURE", unit:"C"}, freq:1};
            expect(sensors.sensors.length).toBe(0);
            sensors.add(payload);
            expect(sensors.sensors.length).toBe(1);
        });
    });
    describe('remove sensor errors', () => {
        it("Missing property 'name' in payload", () => {
            var payload = {};
            expectRemoveSensorError(payload, "missing or invalid key in sensor payload: name");
        });
        it("Accepted sensor stop", () => {
            var payload = {name:"sensname", type:{id:"ROOM_TEMPERATURE", unit:"C"}, freq:1};
            expect(sensors.sensors.length).toBe(0);
            sensors.add(payload);
            expect(sensors.sensors.length).toBe(1);
            sensors.remove(payload);
            expect(sensors.sensors.length).toBe(0);
        });
    });
    describe('sensor type errors', () => {
        it("Missing unit in type ROOM_TEMPERATURE ", () => {
            var payload = {name:"sensname", type:{id:"ROOM_TEMPERATURE"}, freq:0};
            expectAddSensorError(payload, "missing unit");
            expect(sensors.sensors.length).toBe(0);
        });
        it("Bad unit format in type ROOM_TEMPERATURE ", () => {
            var payload = {name:"sensname", type:{id:"ROOM_TEMPERATURE",unit:5}, freq:0};
            expectAddSensorError(payload, "missing unit");
            expect(sensors.sensors.length).toBe(0);
        });
        it("Missing min in type RAND_INT", () => {
            var payload = {name:"sensname", type:{id:"RAND_INT"}, freq:0};
            expectAddSensorError(payload, "missing or invalid type parameter: min");
            expect(sensors.sensors.length).toBe(0);
        });
        it("Bad min format in type RAND_INT, string used", () => {
            var payload = {name:"sensname", type:{id:"RAND_INT",min:"5"}, freq:0};
            expectAddSensorError(payload, "missing or invalid type parameter: min");
            expect(sensors.sensors.length).toBe(0);
        });
        it("Bad min format in type RAND_INT, float used", () => {
            var payload = {name:"sensname", type:{id:"RAND_INT",min:5.23}, freq:0};
            expectAddSensorError(payload, "missing or invalid type parameter: min");
            expect(sensors.sensors.length).toBe(0);
        });
        it("Missing max in type RAND_INT", () => {
            var payload = {name:"sensname", type:{id:"RAND_INT", min:5}, freq:0};
            expectAddSensorError(payload, "missing or invalid type parameter: max");
            expect(sensors.sensors.length).toBe(0);
        });
        it("Bad max format in type RAND_INT, string used", () => {
            var payload = {name:"sensname", type:{id:"RAND_INT",min:5,max:"10"}, freq:0};
            expectAddSensorError(payload, "missing or invalid type parameter: max");
            expect(sensors.sensors.length).toBe(0);
        });
        it("Bad max format in type RAND_INT, float used", () => {
            var payload = {name:"sensname", type:{id:"RAND_INT",min:5,max:10.24}, freq:0};
            expectAddSensorError(payload, "missing or invalid type parameter: max");
            expect(sensors.sensors.length).toBe(0);
        });
        it("Min higher than max in type RAND_INT", () => {
            var payload = {name:"sensname", type:{id:"RAND_INT",min:10,max:4}, freq:0};
            expectAddSensorError(payload, "error to be defined ");
            expect(sensors.sensors.length).toBe(0);
        });
    });
});

function expectAddSensorError(payload, error){
    expect(function (){sensors.add(payload, function(){})}).toThrow(error);
}

function expectRemoveSensorError(payload, error){
    expect(function (){sensors.remove(payload)}).toThrow(error);
}
