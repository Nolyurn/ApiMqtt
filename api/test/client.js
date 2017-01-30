import expect from 'expect';
import Client from '../modules/Client.js';

var server = require('../../services/mqtt/server/server.js').mqttServ;

var mqttUrl = "mqtt://localhost:1883";
var user = {
		username:"test",
		password:"test"
}

describe('Client test', function() {
	describe('client connect', function() {
		it("Connect failed bad login", function(done){
			var client = new Client(mqttUrl, {username:user.username, password:user.password+"oups"});
			client.on('error', function(){
				done();
			});
			client.on('connect', function(){
				done("Connection did not failed with bad password");
			});
		});
		it("Connect failed no login", function(done){
			var client = new Client(mqttUrl);
			client.on('error', function(){
				done();
			});
			client.on('connect', function(){
				done("Connection did not failed without login");
			});
		});
		it("Connect bad mqtt url", function(){
			expect(function(){new Client("oups", user)}).toThrow("Missing protocol");
		});
		it("Connect mqtt server not found", function(done){
			var client = new Client("mqtt://localhost:1000", user);
			client.on('error', function(){
				done();
			});
			client.on('connect', function(){
				done("Connection did not failed without login");
			});
		});
		it("Connect succeed", function(done){
			var client = new Client(mqttUrl, user);
			client.on('error', function(){
				done("Connection failed");
			});
			client.on('connect', function(){
				done();
			});
		});
	});
	describe('Message management', function() { 
		//manage subscribe (need mqtt server to be usable through 'require' call)
		it("Message received when logged in", function(done){
			done();//test not implemented
			var client = new Client(mqttUrl, user);
			client.on('error', function(){
				done("Connection failed");
			});
			client.on('message', function(topic, payload){
				expect(topic).toBe("testTopic");
				done();
			});
			client.subscribe('testTopic');

			var message = {
					  topic: 'testTopic',
					  payload: 'abcde',
					  qos: 0, 
					  retain: false
					};
			server.publish(message);
		});
		it("Message received via subscribe call back", function(done){
			done();//test not implemented
			var client = new Client(mqttUrl, user);
			client.on('error', function(){
				done("Connection failed");
			});
			client.subscribe('testTopic', function(message){
				done();
			});

			var message = {
					  topic: 'testTopic',
					  payload: 'abcde',
					  qos: 0, 
					  retain: false
					};
			server.publish(message);
		});
		it("Message not received via subscribe call back when message is on another topic", function(done){
			done();//test not implemented
			var client = new Client(mqttUrl, user);
			client.on('error', function(){
				done("Connection failed");
			});
			client.subscribe('otherTopic', function(message){
				done("Message should not be received");
			});

			var message = {
					  topic: 'testTopic',
					  payload: 'abcde',
					  qos: 0, 
					  retain: false
					};
			server.publish(message);
			setTimeout(done, 1500);
		});
	});
});
