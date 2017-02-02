import expect from 'expect';

process.env.BROKER_HOST = "";
process.env.AUTH_USER = "";
process.env.AUTH_PASS = "";

import { SensorsSimulator } from '../src/simulator.js';

var sim = new SensorsSimulator("", "", "", "sensors/start", "sensors/stop");

describe('Simulator test', () => {
	afterEach(() =>{
		sim.sensors = []; //clear to avoid side-effects on other tests
	});
	describe('sensors/start errors', () => {
		it("Missing property 'name' in payload", () => {
			var payload = {};
			expectStartPayloadError(payload, "Missing payload property 'name' in "+JSON.stringify(payload));
			expect(sim.sensors.length).toBe(0);
		});
		it("Missing property 'type' in payload", () => {
			var payload = {name:"sensname"};
			expectStartPayloadError(payload, "Missing payload property 'type' in "+JSON.stringify(payload));
			expect(sim.sensors.length).toBe(0);
		});
		it("Missing property 'freq' in payload", () => {
			var payload = {name:"sensname", type:"PERCENT"};
			expectStartPayloadError(payload, "Missing payload property 'freq' in "+JSON.stringify(payload));
			expect(sim.sensors.length).toBe(0);
		});
		it("Sensor already exists", () => {
			var payload = {name:"sensname", type:"PERCENT", freq:1};
			expect(sim.sensors.length).toBe(0);
			sim.start_sensor(payload);
			expect(sim.sensors.length).toBe(1);
			expectStartPayloadError(payload, "Sensor 'sensname' already exists");
			expect(sim.sensors.length).toBe(1);
		});
		it("Freq property is badly set to text", () => {
			var payload = {name:"sensname", type:"PERCENT", freq:"mistake"};
			expectStartPayloadError(payload, "Freq is not a positive number in "+JSON.stringify(payload));
			expect(sim.sensors.length).toBe(0);
		});
		it("Freq property is badly set to negative number", () => {
			var payload = {name:"sensname", type:"PERCENT", freq:-1};
			expectStartPayloadError(payload, "Freq is not a positive number in "+JSON.stringify(payload));
			expect(sim.sensors.length).toBe(0);
		});
		it("Freq property is badly set to zero", () => {
			var payload = {name:"sensname", type:"PERCENT", freq:0};
			expectStartPayloadError(payload, "Freq is not a positive number in "+JSON.stringify(payload));
			expect(sim.sensors.length).toBe(0);
		});
		it("Sensor already started", () => {
			var payload = {name:"sensname", type:"PERCENT", freq:1};
			expect(sim.sensors.length).toBe(0);
			sim.start_sensor(payload);
			expect(sim.sensors.length).toBe(1);
			expectStartPayloadError(payload, "Sensor already started");
			expect(sim.sensors.length).toBe(1);
		});
		it("Accepted payload", () => {
			var payload = {name:"sensname", type:"PERCENT", freq:1};
			expect(sim.sensors.length).toBe(0);
			sim.start_sensor(payload);
			expect(sim.sensors.length).toBe(1);
		});
	});
	describe('sensors/stop errors', () => {
		it("Missing property 'name' in payload", () => {
			var payload = {};
			expectStopPayloadError(payload, "Missing payload property 'name' in "+JSON.stringify(payload));
		});
		it("Sensor not started", () => {
			var payload = {name:"test"};
			expectStopPayloadError(payload, "No sensor started with name 'test'");
		});
		it("Accepted sensor stop", () => {
			var payload = {name:"sensname", type:"PERCENT", freq:1};
			expect(sim.sensors.length).toBe(0);
			sim.start_sensor(payload);
			expect(sim.sensors.length).toBe(1);
			sim.stop_sensor(payload);
			expect(sim.sensors.length).toBe(0);
		});
	});
});

function expectStartPayloadError(payload, error){
	expect(function (){sim.start_sensor(payload)}).toThrow(error);
}

function expectStopPayloadError(payload, error){
	expect(function (){sim.stop_sensor(payload)}).toThrow(error);
}
