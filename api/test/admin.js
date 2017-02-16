import expect from 'expect';
import Admin from '../modules/Admin.js';
import {Privilege} from '../modules/Admin.js';
var mqtt = require('mqtt');

var server = require('./test-server.js').server;

//mocking server
server.on('published', function(packet, client) {
    if(packet.topic !== "admin/create"
        && packet.topic !== "admin/delete"){
        return;
    }
    
    var payload = JSON.parse(packet.payload);
    if(packet.topic === "admin/create" 
            && typeof payload.password == "undefined"){
        return;
    }
    if(packet.topic === "admin/delete" 
            && typeof payload.password != "undefined"){
        return;
    }

    var response = {
        token: payload.token
    };
    if(payload.username === "succeed"){
        response.success = true;
    } else {
        response.success = false;
    }
    server.publish({topic:"admin/event",payload:JSON.stringify(response)});
});


var admin; 
var mqttUrl = "mqtt://localhost:1883";
var adminUser = {
        username:"test",
        password:"test"
};

describe('Admin test', function() {
    describe('user management', function() {
        before(function(done){
            admin = new Admin(mqttUrl, adminUser);
            admin.on('connect', function(){
                done();
            });
            admin.on('error', function(){
                done("Failed to initialize tests");
            });
            
        });
        it("createUser failed", function(done){
            admin.createUser("fail", "password", Privilege.CLIENT, {
                onSuccess: function(){
                    done("createUser should call onError callback");
                },
                onError: function(){
                    done();
                }
            });
        });
        it("createUser succeed", function(done){
            admin.createUser("succeed", "password", Privilege.CLIENT, {
                onSuccess: function(){
                    done();
                },
                onError: function(){
                    done("createUser should call onSuccess callback");
                }
            });
        });
        it("deleteUser failed", function(done){
            admin.deleteUser("fail", {
                onSuccess: function(){
                    done("deleteUser should call onError callback");
                },
                onError: function(){
                    done();
                }
            });
        });
        it("deleteUser succeed", function(done){
            admin.deleteUser("succeed", {
                onSuccess: function(){
                    done();
                },
                onError: function(){
                    done("deleteUser should call onSuccess callback");
                }
            });
        });
    });
});
