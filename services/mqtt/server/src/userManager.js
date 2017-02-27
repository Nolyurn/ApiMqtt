const crypto = require('crypto'), 
      dataAccess = require('./dataAccess');

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
  let password = crypt("admin");
  let privilege = PRIVILEGES.ADMIN_USER;
  storage.init()
}

exports.login = function(username, password, client, callback){
  storage.login(username, password, client, callback)
}

//Necessite des données sous la forme {"method":"createUser","username":"name","password":"pwd","privilege":"privilege",}
exports.createUser = function(mqtt, payload){
  let response="";
  if(!("token" in payload)){
    response = JSON.stringify({"success":false, "token":null, "payload":"no token in payload"}); 
  }
  else if(!("username" in payload)){
    response = JSON.stringify({"success":false, "token":payload.token, "payload":"no username in payload"}); 
  }
  else if(!("password" in payload)){
    response = JSON.stringify({"success":false, "token":payload.token, "payload":"no password in payload"}); 
  }
  else if(!("privilege" in payload)){
    response = JSON.stringify({"success":false, "token":payload.token, "payload":"no privilege in payload"}); 
  }
  else if(!(payload.privilege in PRIVILEGES)){
    response = JSON.stringify({"success":false, "token":payload.token, "payload":"this privilege does not exist"}); 
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
    response = JSON.stringify({"success":false, "token":null, "payload":"no token in payload"}); 
  }
  if(!("username" in payload)){
    response = JSON.stringify({"success":false, "token":payload.token, "payload":"no username in payload"}); 
  }

  if(response!=""){
    mqtt.publish({topic:"admin/event","payload":response})
    return false;
  }

  storage.deleteUser(mqtt,payload);
}