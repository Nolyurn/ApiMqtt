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
                expect(message.toString()).toEqual("user : testuser created with success !");
                var userClient = mqtt.connect('mqtt://localhost:1883', {username:"testuser", password:"testpassword"});
                userClient.on('error', function(){
                    done("Cannot connect with user account");
                });
                userClient.on('connect', function(){
                    client.publish('admin/request', JSON.stringify({
                        method:"setuserpassword",
                        username:"testuser",
                        password:"password"
                    }));
                });
                step = "update";
                break;
            case "update":
                expect(message.toString()).toEqual("Password of user : testuser has been changed with success.");
                var userClient = mqtt.connect('mqtt://localhost:1883', {username:"testuser", password:"password"});
                userClient.on('error', function(){
                    done("Cannot connect with user account after password change");
                });
                userClient.on('connect', function(){
                    client.publish('admin/request', JSON.stringify({
                        method:"removeuser",
                        username:"testuser"
                    }));
                });
                step="delete";
                break;
            case "delete":
                expect(message.toString()).toEqual("User : testuser has been removed with success.");
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
        client.publish('admin/request', JSON.stringify({
            method:"createuser",
            username:"testuser",
            password:"testpassword",
            role:"USER"
        }));
    });
    it("Cannot create user : user already exists", function(done){
        var step = "firstcreate";
        client.on('message', function(topic, message){
            switch(step){
            case "firstcreate":
                step = "test";
                expect(message.toString()).toEqual("user : testuser created with success !");
                client.publish('admin/request', JSON.stringify({
                    method:"createuser",
                    username:"testuser",
                    password:"testpassword",
                    role:"USER"
                }));
                break;
            case "test":
                step = "clear";
                expect(message.toString()).toEqual("The username is ever used !");
                client.publish('admin/request', JSON.stringify({
                    method:"deleteuser",
                    username:"testuser"
                }));
                break;
            case "clear":
                expect(message.toString()).toEqual("User : testuser has been removed with success.");
                done();
                break;
            }
        });
        client.publish('admin/request', JSON.stringify({
            method:"createuser",
            username:"testuser",
            password:"testpassword",
            role:"USER"
        }));
    });
    it("Cannot create user : bad role", function(done){
        client.on('message', function(topic, message){
            expect(message.toString()).toEqual("The username is ever used !");
            done();
        });
        client.publish('admin/request', JSON.stringify({
            method:"createuser",
            username:"testuser",
            password:"testpassword",
            role:"OUPS"
        }));
    });
    it("Cannot create user : no username", function(done){
        client.on('message', function(topic, message){
            expect(message.toString()).toEqual("INVALID DATA : username field not found !");
            done();
        });
        client.publish('admin/request', JSON.stringify({
            method:"createuser"
        }));
    });
    it("Cannot create user : no password", function(done){
        client.on('message', function(topic, message){
            expect(message.toString()).toEqual("INVALID DATA : password field not found !");
            done();
        });
        client.publish('admin/request', JSON.stringify({
            method:"createuser",
            username:"testuser"
        }));
    });
    it("Cannot create user : no role", function(done){
        client.on('message', function(topic, message){
            expect(message.toString()).toEqual("INVALID DATA : role field not found !");
            done();
        });
        client.publish('admin/request', JSON.stringify({
            method:"createuser",
            username:"testuser",
            password:"testpassword"
        }));
    });
    it("Admin call, no method", function(done){
        client.on('message', function(topic, message){
            expect(message.toString()).toEqual("error undefined for this test case");
            done();
        });
        client.publish('admin/request', JSON.stringify({
        }));
    });
});

