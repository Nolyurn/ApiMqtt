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
    username:"simaccount",
    password:"password"
};

//check subscribe authorization based on qos (not set to client request if subscription refused
function checkAuthorizedSubscription(user, topic, doneCallback, shouldBeAuthorized){
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

function checkAuthorizedPublication(user, userCheck, topic, doneCallback, authorized, checkTopic){
    if(checkTopic == undefined){
        checkTopic = topic;
    }
    var done = false;
    var client = mqtt.connect('mqtt://localhost:1883', user);
    var checker = mqtt.connect('mqtt://localhost:1883', userCheck);
    checker.subscribe(checkTopic);
    checker.on('message', function(){
        done = true;
        checker.end();
        if(authorized){
            doneCallback();
        } else {
            doneCallback("Publish should be forbidden");
        }
    });
    setTimeout(function(){
        client.publish(topic, 'test');
        client.end();
    }, 100);
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
    }, 200);
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
                    message.toString().indexOf('"success":true') < 0){
                adminClient.end();
                done(message.toString());
                return;
            }
            messageCount++;
            if(messageCount==3){
                adminClient.end();
                done();
            }
        });
        adminClient.on('connect', function(){
            adminClient.publish('admin/create', JSON.stringify({
                username:user.username,
                password:user.password,
                privilege:"USER",
                token:1
            }));
            adminClient.publish('admin/create', JSON.stringify({
                username:moderator.username,
                password:moderator.password,
                privilege:"MODERATOR",
                token:2
            }));
            adminClient.publish('admin/create', JSON.stringify({
                username:simulator.username,
                password:simulator.password,
                privilege:"SIMULATOR",
                token:3
            }));
        })
    });
    /*simple user
     */
    describe("simple user", function(){
        it("subscription refused on admin/create", function(done){
            checkAuthorizedSubscription(user, 'admin/create', done, false);
        });
        it("publish refused on admin/create", function(done){
            checkAuthorizedPublication(user, adminUser, 'admin/create', done, false, 'admin/event');
        });
        it("subscription refused on admin/delete", function(done){
            checkAuthorizedSubscription(user, 'admin/delete', done, false);
        });
        it("publish refused on admin/delete", function(done){
            checkAuthorizedPublication(user, adminUser, 'admin/delete', done, false, 'admin/event');
        });
        it("subscription refused on admin/event", function(done){
            checkAuthorizedSubscription(user, 'admin/event', done, false);
        });
        it("publish refused on admin/event", function(done){
            checkAuthorizedPublication(user, adminUser, 'admin/event', done, false);
        });
        it("subscription refused on sensor/start", function(done){
            checkAuthorizedSubscription(user, 'sensor/start', done, false);
        });
        it("publish refused on sensor/start", function(done){
            checkAuthorizedPublication(user, simulator, 'sensor/start', done, false);
        });
        it("subscription refused on sensor/stop", function(done){
            checkAuthorizedSubscription(user, 'sensor/stop', done, false);
        });
        it("publish refused on sensor/stop", function(done){
            checkAuthorizedPublication(user, simulator, 'sensor/stop', done, false);
        });
        it("subscription refused on sensor/event", function(done){
            checkAuthorizedSubscription(user, 'sensor/event', done, false);
        });
        it("publish refused on sensor/event", function(done){
            checkAuthorizedPublication(user, moderator, 'sensor/event', done, false);
        });
        it("subscription authorized on sensor/announce", function(done){
            checkAuthorizedSubscription(user, 'sensor/announce', done, true);
        });
        it("publish refused on sensor/announce", function(done){
            checkAuthorizedPublication(user, moderator, 'sensor/announce', done, false);
        });
        it("subscription authorized on value/#", function(done){
            checkAuthorizedSubscription(user, 'value/test', done, true);
        });
        it("publish refused on value/#", function(done){
            checkAuthorizedPublication(user, user, 'value/test', done, false);
        });
    });
    /*moderator
     */
    describe("moderator", function(){
        it("subscription refused on admin/create", function(done){
            checkAuthorizedSubscription(moderator, 'admin/create', done, false);
        });
        it("publish refused on admin/create", function(done){
            checkAuthorizedPublication(moderator, adminUser, 'admin/create', done, false, 'admin/event');
        });
        it("subscription refused on admin/delete", function(done){
            checkAuthorizedSubscription(moderator, 'admin/delete', done, false);
        });
        it("publish refused on admin/delete", function(done){
            checkAuthorizedPublication(moderator, adminUser, 'admin/delete', done, false, 'admin/event');
        });
        it("subscription refused on admin/event", function(done){
            checkAuthorizedSubscription(moderator, 'admin/event', done, false);
        });
        it("publish refused on admin/event", function(done){
            checkAuthorizedPublication(moderator, adminUser, 'admin/event', done, false);
        });
        it("subscription refused on sensor/start", function(done){
            checkAuthorizedSubscription(moderator, 'sensor/start', done, false);
        });
        it("publish allowed on sensor/start", function(done){
            checkAuthorizedPublication(moderator, simulator, 'sensor/start', done, true);
        });
        it("subscription refused on sensor/stop", function(done){
            checkAuthorizedSubscription(moderator, 'sensor/stop', done, false);
        });
        it("publish allowed on sensor/stop", function(done){
            checkAuthorizedPublication(moderator, simulator, 'sensor/stop', done, true);
        });
        it("subscription allowed on sensor/event", function(done){
            checkAuthorizedSubscription(moderator, 'sensor/event', done, true);
        });
        it("publish refused on sensor/event", function(done){
            checkAuthorizedPublication(moderator, moderator, 'sensor/event', done, false);
        });
        it("subscription authorized on sensor/announce", function(done){
            checkAuthorizedSubscription(moderator, 'sensor/announce', done, true);
        });
        it("publish refused on sensor/announce", function(done){
            checkAuthorizedPublication(moderator, user, 'sensor/announce', done, false);
        });
        it("subscription allowed on value/#", function(done){
            checkAuthorizedSubscription(moderator, 'value/test', done, true);
        });
        it("publish refused on value/#", function(done){
            checkAuthorizedPublication(moderator, user, 'value/test', done, false);
        });
    });
    /*simulator
     */
    describe("simulator", function(){
        it("subscription refused on admin/create", function(done){
            checkAuthorizedSubscription(simulator, 'admin/create', done, false);
        });
        it("publish refused on admin/create", function(done){
            checkAuthorizedPublication(simulator, adminUser, 'admin/create', done, false, 'admin/event');
        });
        it("subscription refused on admin/delete", function(done){
            checkAuthorizedSubscription(simulator, 'admin/delete', done, false);
        });
        it("publish refused on admin/delete", function(done){
            checkAuthorizedPublication(simulator, adminUser, 'admin/delete', done, false, 'admin/event');
        });
        it("subscription refused on admin/event", function(done){
            checkAuthorizedSubscription(simulator, 'admin/event', done, false);
        });
        it("publish refused on admin/event", function(done){
            checkAuthorizedPublication(simulator, adminUser, 'admin/event', done, false);
        });
        it("subscription allowed on sensor/start", function(done){
            checkAuthorizedSubscription(simulator, 'sensor/start', done, true);
        });
        it("publish refused on sensor/start", function(done){
            checkAuthorizedPublication(simulator, simulator, 'sensor/start', done, false);
        });
        it("subscription allowed on sensor/stop", function(done){
            checkAuthorizedSubscription(simulator, 'sensor/stop', done, true);
        });
        it("publish refused on sensor/stop", function(done){
            checkAuthorizedPublication(simulator, simulator, 'sensor/stop', done, false);
        });
        it("subscription refused on sensor/event", function(done){
            checkAuthorizedSubscription(simulator, 'sensor/event', done, false);
        });
        it("publish allowed on sensor/event", function(done){
            checkAuthorizedPublication(simulator, moderator, 'sensor/event', done, true);
        });
        it("subscription refused on sensor/announce", function(done){
            checkAuthorizedSubscription(simulator, 'sensor/announce', done, false);
        });
        it("publish authorized on sensor/announce", function(done){
            checkAuthorizedPublication(simulator, user, 'sensor/announce', done, true);
        });
        it("subscription refused on value/#", function(done){
            checkAuthorizedSubscription(simulator, 'value/test', done, false);
        });
        it("publish allowed on value/#", function(done){
            checkAuthorizedPublication(simulator, user, 'value/test', done, true);
        });
    });
    /*admin
     */
    describe("admin", function(){
        it("subscription refused on admin/create", function(done){
            checkAuthorizedSubscription(simulator, 'admin/create', done, false);
        });
        it("publish allowed on admin/create", function(done){
            checkAuthorizedPublication(adminUser, adminUser, 'admin/create', done, true, 'admin/event');
        });
        it("subscription refused on admin/delete", function(done){
            checkAuthorizedSubscription(simulator, 'admin/delete', done, false);
        });
        it("publish allowed on admin/delete", function(done){
            checkAuthorizedPublication(adminUser, adminUser, 'admin/delete', done, true, 'admin/event');
        });
        it("subscription allowed on admin/event", function(done){
            checkAuthorizedSubscription(adminUser, 'admin/event', done, true);
        });
        it("publish refused on admin/event", function(done){
            checkAuthorizedPublication(adminUser, adminUser, 'admin/event', done, false);
        });
        it("subscription refused on sensor/start", function(done){
            checkAuthorizedSubscription(adminUser, 'sensor/start', done, false);
        });
        it("publish refused on sensor/start", function(done){
            checkAuthorizedPublication(adminUser, simulator, 'sensor/start', done, false);
        });
        it("subscription refused on sensor/stop", function(done){
            checkAuthorizedSubscription(adminUser, 'sensor/stop', done, false);
        });
        it("publish refused on sensor/stop", function(done){
            checkAuthorizedPublication(adminUser, simulator, 'sensor/stop', done, false);
        });
        it("subscription refused on sensor/event", function(done){
            checkAuthorizedSubscription(adminUser, 'sensor/event', done, false);
        });
        it("publish refused on sensor/event", function(done){
            checkAuthorizedPublication(adminUser, moderator, 'sensor/event', done, false);
        });
        it("subscription refused on sensor/announce", function(done){
            checkAuthorizedSubscription(adminUser, 'sensor/announce', done, false);
        });
        it("publish refused on sensor/announce", function(done){
            checkAuthorizedPublication(adminUser, user, 'sensor/announce', done, false);
        });
        it("subscription refused on value/#", function(done){
            checkAuthorizedSubscription(adminUser, 'value/test', done, false);
        });
        it("publish refused on value/#", function(done){
            checkAuthorizedPublication(adminUser, user, 'value/test', done, false);
        });
    });
});