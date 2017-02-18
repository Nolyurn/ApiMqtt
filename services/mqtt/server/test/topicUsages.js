var server = require('../src/server.js');
var mqtt = require('mqtt');
var expect = require('expect');

var adminUser = {
    username:"admin",
    password:"admin"
};

var user = {
    username:"user",
    password:"password"
};
var moderator = {
    username:"moderator",
    password:"password"
};
var simulator = {
    username:"simulator",
    password:"password"
};

//check subscribe authorization based on qos (not set to client request if subscription refused
function checkAuthorizedSubscription(client, topic, doneCallback, shouldBeAuthorized){
    var client = mqtt.connect('mqtt://localhost:1883', user);
    client.subscribe(topic, {qos:0}, function(err, grant){
        client.end();
        if(grant[0].qos == 0){
            if(shouldBeAuthorized){
                doneCallback();
            } else {
                doneCallback("Subscribe should be forbidden");
            }
        } else {
            if(shouldBeAuthorized){
                doneCallback("Subscribe should be allowed");
            } else {
                doneCallback();
            }
        }
    });
}

function checkAuthorizedPublication(user, userCheck, topic, doneCallback, authorized){
    var done = false;
    var client = mqtt.connect('mqtt://localhost:1883', user);
    var checker = mqtt.connect('mqtt://localhost:1883', userCheck);
    checker.subscribe(topic);
    checker.on('message', function(){
        done = true;
        checker.end();
        if(authorized){
            doneCallback();
        } else {
            doneCallback("Publish should be forbidden");
        }
    });
    client.publish(topic, 'test');
    client.end();
    setTimeout(function(){
        if(done){
            return;
        }
        checker.end();
        if(authorized){
            doneCallback("Publish should be allowed");
        } else {
            doneCallback();
        }
    }, 1500);
}
describe("topic usage", function(){
    before(function(done){
        var messageCount=0;
        var adminClient = mqtt.connect('mqtt://localhost:1883', adminUser);
        adminClient.on('error', function(){
            done("Cannot connect with admin account");
        });
        adminClient.subscribe('admin/event');
        adminClient.on('message', function(topic, message){
            if(message.length > 0 && 
                    message.toString().indexOf("created with success !") < 0){
                adminClient.end();
                done(message.toString());
            }
            messageCount++;
            if(messageCount==3){
                adminClient.end();
                done();
            }
        });
        adminClient.on('connect', function(){
            adminClient.publish('admin/request', JSON.stringify({
                method:"createuser",
                username:"user",
                password:"password",
                role:"USER"
            }));
            adminClient.publish('admin/request', JSON.stringify({
                method:"createuser",
                username:"moderator",
                password:"password",
                role:"MODERATOR"
            }));
            adminClient.publish('admin/request', JSON.stringify({
                method:"createuser",
                username:"simulator",
                password:"password",
                role:"SIMULATOR"
            }));
        })
    });
    /*simple user
     * cannot :
     *      subscribe/publish on admin/request, admin/event, sensor/create, sensor/delete, sensors/events
     *      publish on value/#
     * can : 
     *      subscribe on value/#
     */
    describe("simple user", function(){
        it("subscription refused on admin/request", function(done){
            checkAuthorizedSubscription(user, 'admin/request', done, false);
        });
        it("publish refused on admin/request", function(done){//TODO not a good test
            checkAuthorizedPublication(user, adminUser, 'admin/request', done, false);
        });
        it("subscription refused on admin/event", function(done){
            checkAuthorizedSubscription(user, 'admin/event', done, false);
        });
        it("publish refused on admin/event", function(done){
            checkAuthorizedPublication(user, adminUser, 'admin/event', done, false);
        });
        it("subscription refused on sensor/create", function(done){
            checkAuthorizedSubscription(user, 'sensor/create', done, false);
        });
        it("publish refused on sensor/create", function(done){
            checkAuthorizedPublication(user, simulator, 'sensor/create', done, false);
        });
        it("subscription refused on sensor/delete", function(done){
            checkAuthorizedSubscription(user, 'sensor/delete', done, false);
        });
        it("publish refused on sensor/delete", function(done){
            checkAuthorizedPublication(user, simulator, 'sensor/delete', done, false);
        });
        it("subscription refused on sensors/events", function(done){
            checkAuthorizedSubscription(user, 'sensors/events', done, false);
        });
        it("publish refused on sensors/events", function(done){
            checkAuthorizedPublication(user, moderator, 'sensors/events', done, false);
        });
        it("subscription authorized on value/#", function(done){
            checkAuthorizedSubscription(user, 'value/test', done, true);
        });
        it("publish refused on value/#", function(done){
            checkAuthorizedPublication(user, user, 'value/test', done, false);
        });
    });
    /*moderator
     * cannot :
     *      subscribe/publish on admin/request, admin/event
     *      subscribe on sensor/create, sensor/delete
     *      publish on value/#, sensor/events
     * can : 
     *      publish on sensor/create, sensor/delete
     *      subscribe on value/#, sensor/events
     */
    describe("moderator", function(){
        it("subscription refused on admin/request", function(done){
            checkAuthorizedSubscription(moderator, 'admin/request', done, false);
        });
        it("publish refused on admin/request", function(done){//TODO not a good test
            checkAuthorizedPublication(moderator, adminUser, 'admin/request', done, false);
        });
        it("subscription refused on admin/event", function(done){
            checkAuthorizedSubscription(moderator, 'admin/event', done, false);
        });
        it("publish refused on admin/event", function(done){
            checkAuthorizedPublication(moderator, adminUser, 'admin/event', done, false);
        });
        it("subscription refused on sensor/create", function(done){
            checkAuthorizedSubscription(moderator, 'sensor/create', done, false);
        });
        it("publish allowed on sensor/create", function(done){
            checkAuthorizedPublication(moderator, simulator, 'sensor/create', done, true);
        });
        it("subscription refused on sensor/delete", function(done){
            checkAuthorizedSubscription(moderator, 'sensor/delete', done, false);
        });
        it("publish allowed on sensor/delete", function(done){
            checkAuthorizedPublication(moderator, simulator, 'sensor/delete', done, true);
        });
        it("subscription allowed on sensors/events", function(done){
            checkAuthorizedSubscription(moderator, 'sensors/events', done, true);
        });
        it("publish refused on sensors/events", function(done){
            checkAuthorizedPublication(moderator, moderator, 'sensors/events', done, false);
        });
        it("subscription allowed on value/#", function(done){
            checkAuthorizedSubscription(moderator, 'value/test', done, true);
        });
        it("publish refused on value/#", function(done){
            checkAuthorizedPublication(moderator, user, 'value/test', done, false);
        });
    });
    /*simulator
     * cannot :
     *      subscribe/publish on admin/request, admin/event
     *      publish on sensor/create, sensor/delete
     * can : 
     *      subscribe on sensor/create, sensor/delete
     *      publish on value/#, sensor/events
     */
    describe("simulator", function(){
        it("subscription refused on admin/request", function(done){
            checkAuthorizedSubscription(simulator, 'admin/request', done, false);
        });
        it("publish refused on admin/request", function(done){//TODO not a good test
            checkAuthorizedPublication(simulator, adminUser, 'admin/request', done, false);
        });
        it("subscription refused on admin/event", function(done){
            checkAuthorizedSubscription(simulator, 'admin/event', done, false);
        });
        it("publish refused on admin/event", function(done){
            checkAuthorizedPublication(simulator, adminUser, 'admin/event', done, false);
        });
        it("subscription allowed on sensor/create", function(done){
            checkAuthorizedSubscription(simulator, 'sensor/create', done, true);
        });
        it("publish refused on sensor/create", function(done){
            checkAuthorizedPublication(simulator, simulator, 'sensor/create', done, false);
        });
        it("subscription allowed on sensor/delete", function(done){
            checkAuthorizedSubscription(simulator, 'sensor/delete', done, true);
        });
        it("publish refused on sensor/delete", function(done){
            checkAuthorizedPublication(simulator, simulator, 'sensor/delete', done, false);
        });
        it("subscription refused on sensors/events", function(done){
            checkAuthorizedSubscription(simulator, 'sensors/events', done, false);
        });
        it("publish allowed on sensors/events", function(done){
            checkAuthorizedPublication(simulator, moderator, 'sensor/events', done, true);
        });
        it("subscription allowed on value/#", function(done){
            checkAuthorizedSubscription(simulator, 'value/test', done, true);
        });
        it("publish allowed on value/#", function(done){
            checkAuthorizedPublication(simulator, user, 'value/test', done, true);
        });
    });
    /*admin
     * cannot :
     *      subscribe/publish on sensor/create, sensor/delete, sensor/events, value/#
     * can : 
     *      subscribe/publish on admin/request
     *      subscribe admin/event
     */
    describe("admin", function(){
        it("subscription allowed on admin/request", function(done){
            checkAuthorizedSubscription(simulator, 'admin/request', done, true);
        });
        it("publish allowed on admin/request", function(done){//TODO not a good test
            checkAuthorizedPublication(adminUser, adminUser, 'admin/request', done, true);
        });
        it("subscription allowed on admin/event", function(done){
            checkAuthorizedSubscription(adminUser, 'admin/event', done, true);
        });
        it("publish refused on admin/event", function(done){
            checkAuthorizedPublication(adminUser, adminUser, 'admin/event', done, false);
        });
        it("subscription refused on sensor/create", function(done){
            checkAuthorizedSubscription(adminUser, 'sensor/create', done, false);
        });
        it("publish refused on sensor/create", function(done){
            checkAuthorizedPublication(adminUser, simulator, 'sensor/create', done, false);
        });
        it("subscription refused on sensor/delete", function(done){
            checkAuthorizedSubscription(adminUser, 'sensor/delete', done, false);
        });
        it("publish refused on sensor/delete", function(done){
            checkAuthorizedPublication(adminUser, simulator, 'sensor/delete', done, false);
        });
        it("subscription refused on sensors/events", function(done){
            checkAuthorizedSubscription(adminUser, 'sensors/events', done, false);
        });
        it("publish refused on sensors/events", function(done){
            checkAuthorizedPublication(adminUser, moderator, 'sensor/events', done, false);
        });
        it("subscription refused on value/#", function(done){
            checkAuthorizedSubscription(adminUser, 'value/test', done, false);
        });
        it("publish refused on value/#", function(done){
            checkAuthorizedPublication(adminUser, user, 'value/test', done, false);
        });
    });
});