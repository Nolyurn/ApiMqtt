import expect from 'expect';
import Moderator from '../src/Moderator.js';
import {Types} from '../src/Moderator.js';

var server = require('./test-server.js').server;

//mocking server
server.on('published', function(packet, client) {
    if(packet.topic !== "sensor/start"
        && packet.topic !== "sensor/stop"){
        return;
    }
    
    var payload = JSON.parse(packet.payload);

    var response = {
        token: payload.token
    };
    if(payload.name === "succeed"){
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
        it("createSensor failed", function(done){
            var sensor = {
                name:"fail",
                type:Types.POSITIVE_NUMBER,
                freq:1
            };
            moderator = new Moderator(mqttUrl, moderatorUser);
            moderator.createSensor(sensor,{
                onSuccess:function(){
                    moderator.end();
                    done("createSensor should call onError callback");
                },
                onError:function(){
                    moderator.end();
                    done();
                }
            });
        });
        it("createSensor succeed", function(done){
            moderator = new Moderator(mqttUrl, moderatorUser);
            moderator.createSensor({
                name:"succeed",
                type:Types.POSITIVE_NUMBER,
                freq:1
            },{
                onSuccess:function(){
                    moderator.end();
                    done();
                },
                onError:function(){
                    moderator.end();
                    done("createSensor should call onSuccess callback");
                }
            });
        });
        it("deleteSensor failed", function(done){
            moderator = new Moderator(mqttUrl, moderatorUser);
            moderator.deleteSensor("fail",{
                onSuccess:function(){
                    moderator.end();
                    done("deleteSensor should call onError callback");
                },
                onError:function(){
                    moderator.end();
                    done();
                }
            });
        });
        it("deleteSensor succeed", function(done){
            moderator = new Moderator(mqttUrl, moderatorUser);
            moderator.deleteSensor("succeed",{
                onSuccess:function(){
                    moderator.end();
                    done();
                },
                onError:function(){
                    moderator.end();
                    done("deleteSensor should call onSuccess callback");
                }
            });
        });
    });
});
