let http     = require('http')
  , httpServ = http.createServer()
  , mosca    = require('mosca')
  , UM = require('./userManager');

const BROKER_PORT = process.env.BROKER_PORT;
const WS_PORT = process.env.WS_PORT;
const ADM_TOPIC_RESPONSE = process.env.ADM_TOPIC_RESPONSE;

//Settings applied to mqttServ
let settings = {
  host: 'localhost',    
  port: 1883    //It should be 1883
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
  UM.setStorageMode("RAM"); //Env docker (RAM | Redis)

  mqttServ.authenticate = function(client, username, password, callback) {
    UM.login(username, password, client, callback); 
  }

  mqttServ.authorizePublish = function(client, topic, payload, callback){
    let authorized = false;
    switch(client.privilege){
      case "ADMIN_USER":
        authorized =   (topic == "admin/create")
                            || (topic == "admin/delete")
        break;
      case "SIMULATOR":
        authorized =    (topic.split('/')[0] == "value")
                            || (topic == "sensor/announce")
                            || (topic == "sensor/event")
        break;
      case "MODERATOR":
        authorized =    (topic.split('/')[0] == "sensor")&&(
                            (topic.split('/')[1] == "start") ||
                            (topic.split('/')[1] == "stop")
                        )
        break;
      case "USER":

        break;
    }
    callback(null,authorized);
  }

  mqttServ.authorizeSubscribe = function(client, topic, callback){
    let authorized = false;
    
    switch(client.privilege){
      case "ADMIN_USER":
        authorized =  (topic == "admin/event");
        break;
      case "SIMULATOR":
        authorized =  (topic.split('/')[0] == "sensor")&&(
                            (topic.split('/')[1] == "start") ||
                            (topic.split('/')[1] == "stop")
                        )
        break;
      case "MODERATOR":
        authorized =  (topic.split('/')[0] == "value")
                        || (topic == "sensor/announce")
                        || (topic == "sensor/event");
        break;
      case "USER":
        authorized =  (topic.split('/')[0] == "value")
                        || (topic == "sensor/announce");
        break;
    }
    callback(null,authorized);
  }
  console.log("Mosca up")
}
 
mqttServ.on('published', function(packet, client) {
  let payload ="";

  if(packet.topic.split('/')[0] == "admin" && packet.topic!="admin/event"){
    try {
      payload = JSON.parse(packet.payload.toString());
    }catch(e){
      mqttServ.publish({topic:"admin/event",payload:JSON.stringify({"success":false, "payload":"payload must be in JSON format"})});
    }
  }
  switch(packet.topic){
    case "admin/create":
      if(payload != ""){UM.createUser(mqttServ, payload)}
      break;
    case "admin/delete":
      if(payload != ""){UM.deleteUser(mqttServ, payload)}
      break;
    /*case "admin/update":
      response = UM.updateUser(mqttServ, payload);
      break;*/
  }
});

exports.server = mqttServ;