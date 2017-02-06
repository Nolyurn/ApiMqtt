import expect from 'expect';
import Moderator from '../modules/Moderator.js';
import {Types} from '../modules/Moderator.js';

var server = require('./test-server.js').server;

// mosca broker binding
server.on('published', function(packet, client) {
    if(packet.topic !== "sensor/start"
        && packet.topic !== "sensor/stop"){
        return;
    }
    
    var payload = JSON.parse(packet.payload);

    var response = {
        token: payload.token
    };
    var shallSucceed;
    switch(packet.topic){
    case "sensor/start":
        shallSucceed = payload.toSend.name;
        break;
    case "sensor/stop":
        shallSucceed = payload.sensor;
        break;
    }
    if(shallSucceed === "succeed"){
        response.success = true;
    } else {
        response.success = false;
    }
    server.publish({topic:"sensor/event",payload:JSON.stringify(response)});
});

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
        it("createSensor failed", function(done){
            var sensor = {
                name:"fail",
                type:Types.POSITIVE_NUMBER,
                freq:1
            };
            moderator.createSensor(sensor,{
                onSuccess:function(){
                    done("createSensor should call onError callback");
                },
                onError:function(){
                    done();
                }
            });
        });
        it("createSensor succeed", function(done){
            moderator.createSensor({
                name:"succeed",
                type:Types.POSITIVE_NUMBER,
                freq:1
            },{
                onSuccess:function(){
                    done();
                },
                onError:function(){
                    done("createSensor should call onSuccess callback");
                }
            });
        });
        it("deleteSensor failed", function(done){
            moderator.deleteSensor("fail",{
                onSuccess:function(){
                    done("deleteSensor should call onError callback");
                },
                onError:function(){
                    done();
                }
            });
        });
        it("deleteSensor succeed", function(done){
            moderator.deleteSensor("succeed",{
                onSuccess:function(){
                    done();
                },
                onError:function(){
                    done("deleteSensor should call onSuccess callback");
                }
            });
        });
    });
});
