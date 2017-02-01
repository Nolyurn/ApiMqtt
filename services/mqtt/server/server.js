let http     = require('http')
  , httpServ = http.createServer()
  , mosca    = require('mosca')
  , UM = require('./userManager');

let TOPIC_ADMIN_REQUEST = "admin/request";
let TOPIC_ADMIN_RESPONSE = "admin/event";

//Settings applied to mqttServ
let settings = {
  host: 'localhost',	
  port: 1883	//It should be 1883
};
 
//here we start mosca
let mqttServ = new mosca.Server(settings);
mqttServ.on('ready', setup);

//Here we add the http server to the mqtt server
mqttServ.attachHttpServer(httpServ);

//Ws port should be 3000
httpServ.listen(3000);
 
//Fired when the mqtt server is ready
function setup() {
	//This function is used to authenticate user
	mqttServ.authenticate = function(client, username, password, callback) {
		let authorized = (UM.login(username, password));
		if (authorized) {
			client.username = username;
			client.role = UM.getUserRole(username);	
		}

		callback(null, authorized);
	}

	mqttServ.authorizePublish = function(client, topic, payload, callback){
		let authorized = false;

		switch(client.role){
			case "ADMIN_USER":
				authorized =	(topic == TOPIC_ADMIN_REQUEST);
				break;
			case "SIMULATOR":
				authorized =	(topic.split('/')[0] == "value")
				break;
			case "MODERATOR":
				authorized =	(topic.split('/')[0] == "sensor")&&(
									(topic.split('/')[1] == "create") ||
									(topic.split('/')[1] == "delete")
								)
				break;
			case "USER":

				break;
		}
		callback(null,authorized);
	}

	mqttServ.authorizeSubscribe = function(client, topic, callback){
		let authorized = false;

		switch(client.role){
			case "ADMIN_USER":
				authorized =	(topic == TOPIC_ADMIN_RESPONSE);
				break;
			case "SIMULATOR":
				authorized =	(topic.split('/')[0] == "sensor")&&(
									(topic.split('/')[1] == "create") ||
									(topic.split('/')[1] == "delete")
								)
				break;
			case "MODERATOR":
				authorized =	(topic.split('/')[0] == "value")
				break;
			case "USER":
				authorized =	(topic.split('/')[0] == "value")
				break;
		}
		callback(null,authorized);
	}
	console.log("Mosca up")
}

mqttServ.on('published', function(packet, client) {
	//packet contient : topic, payload, messageId, qos, retain

	switch(packet.topic){
		case TOPIC_ADMIN_REQUEST:
			let payload ={};
			let response = "";

			try {
				payload = JSON.parse(packet.payload.toString());
			}
			catch (e) {
				response = "Format JSON non respecte !";
			}
			
			switch(payload.method){
				case "createuser":
					response = UM.createUser(payload);
					break;
				case "removeuser":
					response = UM.removeUser(payload);
					break;
				case "setuserpassword":
					response = UM.setUserPassword(payload);
					break;
			}
			mqttServ.publish({topic:TOPIC_ADMIN_RESPONSE,payload:response})
			break;

	}
});

UM.reset();