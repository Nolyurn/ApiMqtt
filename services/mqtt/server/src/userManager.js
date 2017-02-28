const crypto = require('crypto'), 
      dataAccess = require('./dataAccess'),
      util = require('./util');

let storage;

const key    = 'dessert';
    
const PRIVILEGES = {
  ADMIN_USER:"ADMIN_USER",
  SIMULATOR:"SIMULATOR",
  MODERATOR:"MODERATOR",
  USER:"USER"
}
Object.freeze(PRIVILEGES);

function crypt(pwd){
  let hash = crypto.createHmac('sha512', key);
  hash.update(pwd);
  return hash.digest('hex');
}

/*exports.getUsers = function(){
  return users;
}*/

exports.setStorageMode = function(mode){
  switch(mode){
    case "RAM":
      storage = dataAccess.RAM;
      break;
    case "REDIS":
      storage = dataAccess.Redis;
      break;
    default:
      storage = dataAccess.Redis;
      break;
  }
  
  storage.init();
}

exports.init = function(){    
  storage.init()
}

exports.login = function(username, password, client, callback){
  storage.login(username, password, client, callback)
}

//Necessite des données sous la forme {"method":"createUser","username":"name","password":"pwd","privilege":"privilege",}
exports.createUser = function(mqtt, payload){
  let response="";
  if(!("token" in payload)){
    response = util.payloadResponse(false, null, "no token in payload"); 
  }
  else if(!("username" in payload)){
    response = util.payloadResponse(false, payload.token, "no username in payload");
  }
  else if(!("password" in payload)){
  	response = util.payloadResponse(false, payload.token, "no password in payload"); 
  }
  else if(!("privilege" in payload)){
  	response = util.payloadResponse(false, payload.token, "no privilege in payload"); 
  }
  else if(!(payload.privilege in PRIVILEGES)){
  	response = util.payloadResponse(false, payload.token, "this privilege does not exist"); 
  }

  if(response!=""){
    mqtt.publish({topic:"admin/event","payload":response})
    return false;
  }

  storage.createUser(mqtt,payload);
}

exports.deleteUser = function(mqtt, payload){
  let response="";
  if(!("token" in payload)){
  	response = util.payloadResponse(false, null, "this privilege does not exist"); 
  }
  if(!("username" in payload)){
  	response = util.payloadResponse(false, payload.token, "no username in payload"); 
  }

  if(response!=""){
    mqtt.publish({topic:"admin/event","payload":response})
    return false;
  }

  storage.deleteUser(mqtt,payload);
}