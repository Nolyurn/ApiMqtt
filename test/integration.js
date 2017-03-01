import expect from 'expect';
import Moderator from '../api/modules/Moderator.js';
import {Types} from '../api/modules/Moderator.js';
import Client from '../api/modules/Client.js';
import Admin from '../api/modules/Admin.js';
import {Privilege} from '../api/modules/Admin.js';

var mqtt = require('mqtt');
var mqttUrl;
var sensors = ["RAND_INT", "RAND_FLOAT", "RAND_BOOLEAN", "ON_OFF", "OPEN_CLOSE", "ROOM_TEMPERATURE"];
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
        this.timeout(20000);
        adminCreations(done);
    });
    it("mqtt", function(done){
        mqttUrl = "mqtt://localhost:1883";
        this.timeout(20000);
        adminCreations(done);
    });
});

function adminCreations(done){
    console.log("admin creates user and moderator");
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
    console.log("moderator creates sensors");
    var createdCount = 0;
    var createSensor = function(type){
        var sensor = {
            name:type,
            type:{
                id:type
            },
            frequency:1
        };

        if(type==Types.RAND_INT){
            sensor.type.min = 0;
            sensor.type.max = 0;
        }
        if(type==Types.ROOM_TEMPERATURE){
            sensor.type.unit = "C";
        }

        moderator.createSensor(sensor,{
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
    for(var sensor of sensors){
        createSensor(sensor);
    }
}

function userReadings(done){
    console.log("user reads publications on sensor topics");
    if(!user.getTopics().length == 6){
        done("announcement does not list every available topic");
    }
    var publishedTopics = 0;
    var reading = function(topic, payload){
        var type = topic;
        if(type==Types.RAND_INT){
            if(payload.value < 0 || payload.value > 5){
                done("randint payload out of bounds : "+payload.value)
            }
        }
        if(type==Types.ROOM_TEMPERATURE){
            if(payload.type.unit.indexOf("C") != 0){
                done("temperature payload does not use correct unit : "+payload.type.unit)
            }
        }

        publishedTopics++;
        if(publishedTopics == sensors.length){
            userUnsubscribe(done);
        }
    }
    for(var sensor of sensors){
        user.subscribe(sensor, reading);
    }
}

function userUnsubscribe(done){
    console.log("user unsubscribes from topics");
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
    console.log("moderator deletes topics");
    var deletedCount = 0;
    var deleteSensor = function(type){
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
    for(var sensor of sensors){
        deleteSensor(sensor);
    }
}

function userNotReading(done){
    console.log("user tries to read on deleted sensors topics");
    user.subscribe(sensors[0], function(){
        done("user receives payloads after sensor deletion");
    });
    userAndModeratorTryAdminMethods(done);
}

function checkSubscriptionRefused(user, topic, doneCallback, continueCallback){
    var client = mqtt.connect(mqttUrl, user);
    client.subscribe(topic, {qos:0}, function(err, grant){
        client.end();
        if(grant[0].qos == 0){
            doneCallback("Subscribe on "+topic+" should be forbidden for "+user.username);
        } else {
            continueCallback();
        }
    });
}

function checkPublicationRefused(user, checker, topic, doneCallback, continueCallback){
    var client = mqtt.connect(mqttUrl, user);
    var checker = mqtt.connect(mqttUrl, checker);
    checker.subscribe(topic);
    checker.on('message', function(){
        checker.end();
        doneCallback("Publish on "+topic+" should be forbidden for "+user.username);
    });
    client.publish(topic, 'test');
    client.end();
    setTimeout(function(){
        checker.end();
        continueCallback();
    }, 400);
}

function userAndModeratorTryAdminMethods(done){
    console.log("admin methods usage by user and moderator");
    var userdata = {username:"user", password:"user"};
    var admindata = {username:"admin", password:"admin"};
    var moderatordata = {username:"moderator", password:"moderator"};
    
    var testUser = function(data, callback){
        checkSubscriptionRefused(data, topics.admin.create, done, function(){
            checkSubscriptionRefused(data, topics.admin.delete, done, function(){
                checkPublicationRefused(data, admindata, topics.admin.create, done, function(){
                    checkPublicationRefused(data, admindata, topics.admin.delete, done, function(){
                        callback();
                    });
                });
            });
        });
    }

    testUser(userdata, function(){
        testUser(moderatordata, function(){
            userAndAdminTryModeratorMethods(done);
        });
    });
    
}

function userAndAdminTryModeratorMethods(done){
    console.log("moderator methods usage by user and admin");
    var userdata = {username:"user", password:"user"};
    var admindata = {username:"admin", password:"admin"};
    var moderatordata = {username:"moderator", password:"moderator"};
    
    var testUser = function(data, callback){
        checkSubscriptionRefused(data, topics.moderator.start, done, function(){
            checkSubscriptionRefused(data, topics.moderator.stop, done, function(){
                checkPublicationRefused(data, moderatordata, topics.moderator.start, done, function(){
                    checkPublicationRefused(data, moderatordata, topics.moderator.stop, done, function(){
                        callback();
                    });
                });
            }); 
        });
    }

    testUser(userdata, function(){
        testUser(admindata, function(){
            userAdminAndModeratorTrySimulatorMethods(done);
        });
    });
    
}

function userAdminAndModeratorTrySimulatorMethods(done){
    console.log("moderator methods usage by user and admin");
    var userdata = {username:"user", password:"user"};
    var admindata = {username:"admin", password:"admin"};
    var moderatordata = {username:"moderator", password:"moderator"};
    
    var testUser = function(data, callback){
        checkPublicationRefused(data, userdata, topics.simulator.sensor, done, function(){
            checkPublicationRefused(data, userdata, topics.simulator.announces, done, function(){
                callback();
            });
        });
    }

    testUser(userdata, function(){
        testUser(admindata, function(){
            testUser(moderatordata, function(){
                adminDeletions(done);
            });
        });
    });
    
}

function adminDeletions(done){
    console.log("admin deletes user and moderator");
    user.end();
    moderator.end();
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



