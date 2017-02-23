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
    response = `{"success":false, "token":null, payload:"no token in payload"}`; 
  }
  if(!("username" in payload)){
    response = `{"success":false, "token":${payload.token}, payload:"no username in payload"}`; 
  }
  if(!("password" in payload)){
    response = `{"success":false, "token":${payload.token}, payload:"no password in payload"}`; 
  }
  if(!("privilege" in payload)){
    response = `{"success":false, "token":${payload.token}, payload:"no privilege in payload"}`; 
  }
  if(!(payload.privilege in PRIVILEGES)){
    response = `{"success":false, "token":${payload.token}), payload:"this privilege does not exist"}`; 
  }

  if(response!=""){
    mqtt.publish({topic:"admin/event",payload:`${response}`})
    return false;
  }

  storage.createUser(mqtt,payload);
}

exports.deleteUser = function(mqtt, payload){
  let response="";
  if(!("token" in payload)){
    response = `{"success":false, "token":null, payload:"no token in payload"}`; 
  }
  if(!("username" in payload)){
    response = `{"success":false, "token":${payload.token}, payload:"no username in payload"}`; 
  }

  if(response!=""){
    mqtt.publish({topic:"admin/event",payload:`${response}`})
    return false;
  }

  storage.deleteUser(mqtt,payload);
}
/*
exports.updateUser = function(mqtt, payload){
  let response = "";
  if(!("token" in payload)){
    response = `{"success":false, token:null, payload:"no token in payload"}`; 
  }
  if(!("username" in payload)){
    response = `{"success":false, token:$(payload.token), payload:"no username in payload"}`; 
  }

  redis_cli.get(payload.username, function(err, reply){
    if(reply == null){
      response = `{"success":false, token:$(payload.token), payload:"this username does not exist"}`;
    }else{
      //Donner le nouveau password et/ou privilege, privilege doit être dans les privilege possible
      response = `{"success":true, token:${payload.token}`;
      redis_cli.set()
    }
    mqtt.publish({topic:"admin/event",payload:`${response}`})
  }) 
}*/