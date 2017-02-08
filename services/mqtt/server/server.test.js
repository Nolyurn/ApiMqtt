var server = require('./server.js');
var mqtt = require('mqtt');
var expect = require('expect');

describe("Mqtt server connection", function(){
	it("Connection without login failed", function(done){
		var client = mqtt.connect('mqtt://localhost:1883');
		client.on('error', function(){
			done();
		});
		client.on('connect', function(){
			done("connection successed without login");
		})
	});
	it("Connection with bad user and matching password failed", function(done){
		var client = mqtt.connect('mqtt://localhost:1883', {username:"oups",password:"test"});
		client.on('error', function(){
			done();
		});
		client.on('connect', function(){
			done("connection successed");
		})
	});
	it("Connection with bad pasword and matching user failed", function(done){
		var client = mqtt.connect('mqtt://localhost:1883', {username:"test",password:"oups"});
		client.on('error', function(){
			done();
		});
		client.on('connect', function(){
			done("connection successed");
		})
	});
	it("Connection with test/test successed", function(done){
		var client = mqtt.connect('mqtt://localhost:1883', {username:"test",password:"test"});
		client.on('error', function(){
			done("connection failed");
		});
		client.on('connect', function(){
			done();
		})
	});
});

describe("Mqtt server topic usage", function(){
	it("", function(){
		//TODO
	});
});
