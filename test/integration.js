import expect from 'expect';
import Moderator from '../api/modules/Moderator.js';
import {Types} from '../api/modules/Moderator.js';
import Client from '../api/modules/Client.js';
import Admin from '../api/modules/Admin.js';
import {Privilege} from '../api/modules/Admin.js';

var mqttUrl;
var sensors = ["RAND_INT", "RAND_FLOAT", "RAND_BOOLEAN", "ON_OFF", "OPEN_CLOSE", "TEMPERATURE"];
var admin, moderator, user;
var topics = {
    admin:{
        create:"admin/create",
        delete:"admin/delete"
    },
    moderator:{
        start:"sensor/start",
        stop:"sensor/stop"
    },
    simulator:{
        sensor:"value/test",
        announces:"sensor/announces"
    }
};

describe('Integration test', function() {
    it("webservice", function(done){
        mqttUrl = "ws://localhost:3000";
        this.timeout(60000);//1 minute for the integration test to be done
        adminCreations(done);
    });
    it("mqtt", function(done){
        mqttUrl = "mqtt://localhost:1883";
        this.timeout(60000);//1 minute for the integration test to be done
        adminCreations(done);
    });
});

function adminCreations(done){
    console.log("admin creations");
    admin = new Admin(mqttUrl, {username:"admin", password:"admin"});
    admin.on('error', function(e){
        done("an error happened : "+e);
    })
    admin.on('close', function(){
        done("admin client has been closed");
    })
    admin.createUser("user", "user", Privilege.USER, {
        onSuccess: function(){
            console.log("user created");
            admin.createUser("moderator", "moderator", Privilege.MODERATOR, {
                onSuccess: function(){
                    console.log("moderator created");
                    moderator = new Moderator(mqttUrl, {username:"moderator", password:"moderator"});
                    user = new Client(mqttUrl, {username:"user", password:"user"});
                    moderatorCreations(done);
                },
                onError: function(){
                    done("cannot create moderator with admin");
                }
            }); 
        },
        onError: function(){
            done("cannot create simple user with admin");
        }
    });
}

function moderatorCreations(done){ 
    console.log("moderator creation ");
    var createdCount = 0;
    createSensor = function(type){
        var sensor = {
            name:type,
            type:{
                id:Types[type]
            },
            frequency:1
        };

        if(type==Types.RAND_INT){
            sensor.type.min = 0;
            sensor.type.max = 0;
        }
        if(type==Types.TEMPERATURE){
            sensor.type.unit = "C";
        }
        
        moderator.createSensor(type,{
            onSuccess:function(){
                console.log("sensor "+type+" created");
                createdCount++;
                if(createdCount==sensors.length){
                    userReadings(done);
                }
            },
            onError:function(){
                done("Cannot create "+type+" sensor");
            }
        });
    }
    for(sensor of sensors){
        createSensor(sensor);
    }
}

function userReadings(done){
    console.log("user readings ");
    if(!user.getTopics().length == 6){
        done("announcement does not list every available topic");
    }
    var publishedTopics = 0;
    reading = function(topic, payload){
        if(type==Types.RAND_INT){
            if(payload.value < 0 || payload.value > 5){
                done("randint payload out of bounds : "+payload.value)
            }
        }
        if(type==Types.TEMPERATURE){
            if(payload.value.indexOf('C') < 0){
                done("temperature payload does not use correct unit : "+payload.value)
            }
        }

        publishedTopics++;
        if(publishedTopics == sensors.length){
            userUnsubscribe(done);
        }
    }
    for(sensor of sensors){
        user.subscribe(sensor, reading);
    }
}

function userUnsubscribe(done){
    console.log("user unsubscribe ");
    var unsubscribed = false;
    user.subscribe(sensors[0], function(){
        if(unsubscribed){
            done("user receives payloads after unsubscribe was called");
        }
    });
    user.unsubscribe(sensors[0]);
    unsubscribed = true;
    setTimeout(function(){
        moderatorDeletions(done);
    }, 1100);
}

function moderatorDeletions(done){
    console.log("moderator deletions ");
    var deletedCount = 0;
    deleteSensor = function(type){
        moderator.deleteSensor(type,{
            onSuccess:function(){
                console.log("sensor "+type+" deleted");
                deletedCount++;
                if(deletedCount == sensors.length){
                    userNotReading(done);
                }
            },
            onError:function(){
                done("Cannot delete "+type+" sensor");
            }
        });
    }
    for(sensor of sensors){
        deleteSensor(sensor);
    }
}

function userNotReading(done){
    console.log("user reading after sensor deletions");
    user.subscribe(sensors[0], function(){
        done("user receives payloads after sensor deletion");
    });
    userAndModeratorTryAdminMethods(done);
}

function checkSubscriptionRefused(user, topic, doneCallback){
    var client = mqtt.connect('mqtt://localhost:1883', user);
    client.subscribe(topic, {qos:0}, function(err, grant){
        client.end();
        if(grant[0].qos == 0){
            client.end();
            doneCallback("Subscribe on "+topic+" should be forbidden for "+user.username);
        } 
    });
}

function checkPublicationRefused(user, checker, topic, doneCallback){
    var client = mqtt.connect('mqtt://localhost:1883', user);
    var checker = mqtt.connect('mqtt://localhost:1883', userCheck);
    checker.subscribe(topic);
    checker.on('message', function(){
        checker.end();
        doneCallback("Publish on "+topic+" should be forbidden for "+user.username);
    });
    client.publish(topic, 'test');
    client.end();
    setTimeout(function(){
        checker.end();
    }, 500);
}

function userAndModeratorTryAdminMethods(done){
    console.log("admin methods usage by user and moderator");
    var userdata = {username:"user", password:"user"};
    var admindata = {username:"admin", password:"admin"};
    var moderatordata = {username:"moderator", password:"moderator"};
    
    var testUser = function(data){
        checkSubscriptionRefused(data, topics.admin.create, done);
        checkSubscriptionRefused(data, topics.admin.delete, done);
        checkPublicationRefused(data, admindata, topics.admin.create, done);
        checkPublicationRefused(data, admindata, topics.admin.delete, done);
    }

    testUser(userdata);
    testUser(moderatordata);
    
    userAndAdminTryModeratorMethods(done);
}

function userAndAdminTryModeratorMethods(done){
    console.log("moderator methods usage by user and admin");
    var userdata = {username:"user", password:"user"};
    var admindata = {username:"admin", password:"admin"};
    var moderatordata = {username:"moderator", password:"moderator"};
    
    var testUser = function(data){
        checkSubscriptionRefused(data, topics.moderator.start, done);
        checkSubscriptionRefused(data, topics.moderator.stop, done);
        checkPublicationRefused(data, moderatordata, topics.moderator.start, done);
        checkPublicationRefused(data, moderatordata, topics.moderator.stop, done);
    }

    testUser(userdata);
    testUser(admindata);
    
    userAdminAndModeratorTrySimulatorMethods(done);
}

function userAdminAndModeratorTrySimulatorMethods(done){
    console.log("moderator methods usage by user and admin");
    var userdata = {username:"user", password:"user"};
    var admindata = {username:"admin", password:"admin"};
    var moderatordata = {username:"moderator", password:"moderator"};
    
    var testUser = function(data){
        checkPublicationRefused(data, userdata, topics.simulator.sensor, done);
        checkPublicationRefused(data, userdata, topics.simulator.announces, done);
    }

    testUser(userdata);
    testUser(admindata);
    testUser(moderatordata);
    
    adminDeletions(done);
}

function adminDeletions(done){
    console.log("admin deletes user and moderator");
    admin.deleteUser("user", {
        onSuccess: function(){
            console.log("user deleted");
            admin.deleteUser("moderator", {
                onSuccess: function(){
                    console.log("moderator deleted");
                    moderatorAndUserCannotReconnect(done);
                },
                onError: function(){
                    done("cannot delete moderator with admin");
                }
            }); 
        },
        onError: function(){
            done("cannot delete simple user with admin");
        }
    });
}

function moderatorAndUserCannotReconnect(done){
    console.log("moderator and user try to reconnect");
    var client = new Client(mqttUrl, {username:"user", password:"user"});
    client.on('error', function(){
        client.end();
        var moderator = new Moderator(mqttUrl, {username:"moderator", password:"moderator"});
        moderator.on('error', function(){
            moderator.end();
            done();
        });
    });
}



