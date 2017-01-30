import expect from 'expect';
import Moderator from '../modules/Moderator.js';
import {Types} from '../modules/Moderator.js';

var server = require('../../services/mqtt/server/server.js').mqttServ;

var moderator; 
var mqttUrl = "mqtt://localhost:1883";
var simpleUser = {
		username:"test",
		password:"test"
};
var moderatorUser = {
		username:"test",
		password:"test"
};

describe('Moderator test', function() {
	describe('sensor management', function() {
		before(function(done){
			moderator = new Moderator(mqttUrl, moderatorUser);
			moderator.on('connect', function(){
				done();
			});
			moderator.on('error', function(){
				done("Failed to initialize tests");
			});
		});
		it("createSensor failed : sensor already exists", function(done){
			var sensor = {
				name:"csf_sae",
				type:Types.POSITIVE_NUMBER,
				freq:1
			};
			moderator.createSensor(sensor,{
				onSuccess:function(){
					moderator.createSensor(sensor,{
						onSuccess:function(){
							done("Same sensor has been created twice");
						},
						onError:function(){
							done();
						}
					});
				},
				onError:function(){
					done("Failed to create first sensor");
				}
			});
		});
		it("createSensor failed : name undefined", function(done){
			var sensor = {
					type:Types.POSITIVE_NUMBER,
					freq:1
				};
			moderator.createSensor(sensor,{
				onSuccess:function(){
					done("Sensor with no name has been created");
				},
				onError:function(){
					done();
				}
			});
		});
		it("createSensor failed : type undefined", function(done){
			var sensor = {
					name:"test",
					freq:1
				};
			moderator.createSensor(sensor,{
				onSuccess:function(){
					done("Sensor with no type has been created");
				},
				onError:function(){
					done();
				}
			});
		});
		it("createSensor failed : freq undefined", function(done){
			var sensor = {
					name:"test",
					type:Types.POSITIVE_NUMBER,
				};
			moderator.createSensor(sensor,{
				onSuccess:function(){
					done("Sensor with no freq has been created");
				},
				onError:function(){
					done();
				}
			});
		});
		it("createSensor failed : not a moderator account", function(done){
			var client = new Moderator(mqttUrl, simpleUser);
			var sensor = {
					name:"test",
					type:Types.POSITIVE_NUMBER,
					freq:1
				};
			client.createSensor(sensor,{
				onSuccess:function(){
					done();
				},
				onError:function(){
					done("Simple user should not be able to create a sensor");
				}
			});
		});
		it("createSensor succeed", function(done){
			moderator.createSensor({
				name:"css",
				type:Types.POSITIVE_NUMBER,
				freq:1
			},{
				onSuccess:function(){
					done();
				},
				onError:function(){
					done("Failed to create a sensor");
				}
			});
		});
		it("deleteSensor failed : sensor does not exist", function(done){
			moderator.deleteSensor("dsf",{
				onSuccess:function(){
					done("Succeed to delete an inexistant sensor");
				},
				onError:function(){
					done();
				}
			});
		});
		it("deleteSensor successed", function(done){
			moderator.createSensor({
				name:"dss",
				type:Types.POSITIVE_NUMBER,
				freq:1
			},{
				onSuccess:function(){
					moderator.deleteSensor("dss",{
						onSuccess:function(){
							done();
						},
						onError:function(){
							done("Failed to delete a valid sensor");
						}
					});
				},
				onError:function(){
					done("Failed to create a sensor");
				}
			});
		});
		it("deleteSensor failed : not a moderator account", function(done){
			var client = new Moderator(mqttUrl, simpleUser);
			moderator.createSensor({
				name:"dsf_nama",
				type:Types.POSITIVE_NUMBER,
				freq:1
			},{
				onSuccess:function(){
					client.deleteSensor("dsf_nama",{
						onSuccess:function(){
							done("Succeed to delete a sensor with a simple account");
						},
						onError:function(){
							done();
						}
					});
				},
				onError:function(){
					done("Failed to create a sensor");
				}
			});
		});
	});
});
