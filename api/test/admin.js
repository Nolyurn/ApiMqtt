import expect from 'expect';
import Admin from '../modules/Admin.js';
import {Privilege} from '../modules/Admin.js';

var server = require('../../services/mqtt/server/server.js').mqttServ;

var admin; 
var mqttUrl = "mqtt://localhost:1883";
var simpleUser = {
		username:"test",
		password:"test"
};
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
		it("createUser failed : user already exists", function(done){
			admin.createUser("cuf_uae", "test", Privilege.CLIENT, {
				onSuccess: function(){
					admin.createUser("cuf_uae", "test", Privilege.CLIENT, {
						onSuccess: function(){
							done("creating the same user twice should fail");
						},
						onError: function(){
							done();
						}
					});
				},
				onError: function(){
					done("first creation failed, something is wrong in test script");
				}
			});
		});
		it("createUser failed : name undefined", function(done){
			admin.createUser("", "test", Privilege.CLIENT, {
				onSuccess: function(){
					done("creating the same user twice should fail");
				},
				onError: function(){
					done();
				}
			});
		});
		it("createUser failed : not an admin account", function(done){
			var client = new Admin(mqttUrl, simpleUser);
			client.createUser("test", "test", Privilege.CLIENT, {
				onSuccess: function(){
					done("create a user without being admin should fail");
				},
				onError: function(){
					done();
				}
			});
		});
		it("createUser successed", function(done){
			admin.createUser("cus", "password", Privilege.CLIENT, {
				onSuccess: function(){
					done();
				},
				onError: function(){
					done("Creation failed");
				}
			});
		});
		it("deleteUser failed : user does not exist", function(done){
			admin.deleteUser("duf_udne", "password", Privilege.CLIENT, {
				onSuccess: function(){
					done("Deleting an inexistant user should fail");
				},
				onError: function(){
					done();
				}
			});
		});
		it("deleteUser successed", function(done){
			admin.createUser("dus", "test", Privilege.CLIENT, {
				onSuccess: function(){
					admin.deleteUser("dus", {
						onSuccess: function(){
							done();
						},
						onError: function(){
							done("cannot delete the user");
						}
					});
				},
				onError: function(){
					done("first creation failed, something is wrong in test script");
				}
			});
		});
		it("deleteUser failed : not an admin account", function(done){
			var client = new Admin(mqttUrl, simpleUser);
			admin.createUser("test", "test", Privilege.CLIENT, {
				onSuccess: function(){
					client.deleteUser("test", {
						onSuccess: function(){
							done("delete a user without being admin should fail");
						},
						onError: function(){
							done();
						}
					});
				},
				onError: function(){
					done("first creation failed, something is wrong in test script");
				}
			});
		});
	});
});
