var server = require('../src/server.js');
var mqtt = require('mqtt');
var expect = require('expect');

var adminUser = {
    username:"admin",
    password:"admin"
};

describe("server connection", function(){
    it("Connection without login failed", function(done){
        var client = mqtt.connect('mqtt://localhost:1883');
        client.on('error', function(){
            client.end();
            done();
        });
        client.on('connect', function(){
            client.end();
            done("connection successed without login");
        })
    });
    it("Connection with bad user and matching password failed", function(done){
        var client = mqtt.connect('mqtt://localhost:1883', {username:"oups",password:"admin"});
        client.on('error', function(){
            client.end();
            done();
        });
        client.on('connect', function(){
            client.end();
            done("connection successed");
        })
    });
    it("Connection with bad pasword and matching user failed", function(done){
        var client = mqtt.connect('mqtt://localhost:1883', {username:"admin",password:"oups"});
        client.on('error', function(){
            client.end();
            done();
        });
        client.on('connect', function(){
            client.end();
            done("connection successed");
        })
    });
    it("Connection with test/test successed", function(done){
        var client = mqtt.connect('mqtt://localhost:1883', adminUser);
        client.on('error', function(){
            done("connection failed");
        });
        client.on('connect', function(){
            client.end();
            done();
        })
    });
});
//packet contient : topic, payload, messageId, qos, retain
var client;
describe("admin methods", function(){
    beforeEach(function(done){
        client = mqtt.connect('mqtt://localhost:1883', adminUser);
        client.on('error', function(){
            done("Cannot connect with admin account");
        });
        client.on('connect', function(){
            client.subscribe('admin/event');
            done();
        })
    });
    afterEach(function(){
        client.end();
    });
    it("Create/delete simple user with password edition", function(done){
        var step = "create";
        client.on('message', function(topic, message){
            switch(step){
            case "create":
                var payload = JSON.parse(message.toString());
                expect(payload.success).toBe(true);
                var userClient = mqtt.connect('mqtt://localhost:1883', {username:"testuser", password:"testpassword"});
                userClient.on('error', function(){
                    done("Cannot connect with user account");
                });
                userClient.on('connect', function(){
                    step = "delete";
                    client.publish('admin/delete', JSON.stringify({
                        username:"testuser",
                        token:2
                    }));
                });
                break;
            case "delete":
                var payload = JSON.parse(message.toString());
                expect(payload.success).toBe(true);
                var userClient = mqtt.connect('mqtt://localhost:1883', {username:"testuser", password:"password"});
                userClient.on('error', function(){
                    userClient.end();
                    done();
                });
                userClient.on('connect', function(){
                    userClient.end();
                    done("User always exists after deletion");
                });
                break;
            }
        });
        client.publish('admin/create', JSON.stringify({
            username:"testuser",
            password:"testpassword",
            privilege:"USER",
            token:1
        }));
    });
    it("Cannot create user : user already exists", function(done){
        var step = "firstcreate";
        client.on('message', function(topic, message){
            switch(step){
            case "firstcreate":
                step = "test";
                var payload = JSON.parse(message.toString());
                expect(payload.success).toBe(true);
                client.publish('admin/create', JSON.stringify({
                    username:"testuser",
                    password:"testpassword",
                    privilege:"USER",
                    token:2
                }));
                break;
            case "test":
                step = "clear";
                var payload = JSON.parse(message.toString());
                expect(payload.success).toBe(false);
                expect(payload.payload).toBe("this username is ever used");
                client.publish('admin/delete', JSON.stringify({
                    username:"testuser",
                    token:3
                }));
                break;
            case "clear":
                var payload = JSON.parse(message.toString());
                expect(payload.success).toBe(true);
                done();
                break;
            }
        });
        client.publish('admin/create', JSON.stringify({
            username:"testuser",
            password:"testpassword",
            privilege:"USER",
            token:1
        }));
    });
    it("Cannot create user : bad role", function(done){
        client.on('message', function(topic, message){
            var payload = JSON.parse(message.toString());
            expect(payload.success).toBe(false);
            expect(payload.payload).toBe("this privilege does not exist");
            done();
        });
        client.publish('admin/create', JSON.stringify({
            username:"testuser",
            password:"testpassword",
            privilege:"OUPS",
            token:1
        }));
    });
    it("Cannot create user : no username", function(done){
        client.on('message', function(topic, message){
            var payload = JSON.parse(message.toString());
            expect(payload.success).toBe(false);
            expect(payload.payload).toBe("no username in payload");
            done();
        });
        client.publish('admin/create', JSON.stringify({
            token:1
        }));
    });
    it("Cannot create user : no password", function(done){
        client.on('message', function(topic, message){
            var payload = JSON.parse(message.toString());
            expect(payload.success).toBe(false);
            expect(payload.payload).toBe("no password in payload");
            done();
        });
        client.publish('admin/create', JSON.stringify({
            username:"testuser",
            token:1
        }));
    });
    it("Cannot create user : no role", function(done){
        client.on('message', function(topic, message){
            var payload = JSON.parse(message.toString());
            expect(payload.success).toBe(false);
            expect(payload.payload).toBe("no privilege in payload");
            done();
        });
        client.publish('admin/create', JSON.stringify({
            username:"testuser",
            password:"testpassword",
            token:1
        }));
    });
    it("Cannot delete user : no username", function(done){
        client.on('message', function(topic, message){
            var payload = JSON.parse(message.toString());
            expect(payload.success).toBe(false);
            expect(payload.payload).toBe("no username in payload");
            done();
        });
        client.publish('admin/delete', JSON.stringify({
            token:1
        }));
    });
});

