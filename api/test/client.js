import expect from 'expect';
import Client from '../modules/Client.js';

var server = require('./test-server.js').server;
server.authenticate = function(client, username, password, callback) {
    let authorized = (username === 'test' && password.toString() === 'test');
    if (authorized) client.user = username;
    callback(null, authorized);
}
//server.on('published', function(packet, client) {
//    console.log(packet);
//});

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
                client.end();
                done();
            });
            client.on('connect', function(){
                client.end();
                done("Connection did not failed with bad password");
            });
        });
        it("Connect failed no login", function(done){
            var client = new Client(mqttUrl);
            client.on('error', function(){
                client.end();
                done();
            });
            client.on('connect', function(){
                client.end();
                done("Connection did not failed without login");
            });
        });
        it("Connect bad mqtt url", function(){
            expect(function(){new Client("oups", user)}).toThrow("Missing protocol");
        });
        it("Connect mqtt server not found", function(done){
            var client = new Client("mqtt://localhost:1000", user);
            client.on('error', function(){
                client.end();
                done();
            });
            client.on('connect', function(){
                client.end();
                done("Connection did not failed on bad mqtt server");
            });
        });
        it("Connect succeed", function(done){
            var client = new Client(mqttUrl, user);
            client.on('error', function(){
                client.end();
                done("Connection failed");
            });
            client.on('connect', function(){
                client.end();
                done();
            });
        });
    });
    describe('Message management', function() { 
        it("Message received when logged in", function(done){
            var client = new Client(mqttUrl, user);
            client.on('error', function(){
                done("Connection failed");
            });
            client.on('message', function(topic, payload){
                expect(payload.test).toBe("abcde");
                expect(topic).toBe("testTopic");
                done();
            });
            client.subscribe('testTopic');

           setTimeout( function(){
               server.publish({topic:"value/testTopic",payload:'{"test":"abcde"}'});
           }, 500);
        });
        it("Message received via subscribe callback", function(done){
            var client = new Client(mqttUrl, user);
            client.on('error', function(){
                done("Connection failed");
            });
            client.subscribe('testTopic', function(topic, message){
                expect(message.test).toBe("fghij");
                client.end();
                done();
            });

            setTimeout( function(){
                server.publish({topic:"value/testTopic",payload:'{"test":"fghij"}'});
            }, 500);
        });
        it("Message not received via subscribe call back when message is on another topic", function(done){
            var client = new Client(mqttUrl, user);
            var nothingHappened = true;
            
            client.on('error', function(){
                nothingHappened = false;
                done("Connection failed");
            });
            client.subscribe('otherTopic', function(topic, message){
                nothingHappened = false;
                done("Message should not be received");
            });

            setTimeout( function(){
                server.publish({topic:"value/testTopic",payload:'{"test":"abcde"}'});
            }, 500);

            setTimeout(function(){
                if(nothingHappened){
                    done();
                }
            }, 1500);
        });
        it("Message not received after unsubscribing", function(done){
            var client = new Client(mqttUrl, user);
            var nothingHappened = true;
            client.on('error', function(){
                nothingHappened = false;
                done("Connection failed");
            });
            
            client.subscribe('testTopic', function(topic, message){
                nothingHappened = false;
                done("Message should not be received");
            });
            client.unsubscribe('testTopic');
            
            setTimeout( function(){
                server.publish({topic:"value/testTopic",payload:'{"test":"abcde"}'});
            }, 500);
            
            setTimeout(function(){
                if(nothingHappened){
                    done();
                }
            }, 1500);
        });
    });
});
