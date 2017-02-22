const crypto = require('crypto')
  , redis  = require("redis");

const REDIS_PORT = 6379;

let redis_cli = null;

redis_cli = redis.createClient({  
  port:REDIS_PORT,
  host:'redis',
  retry_strategy: function (options) {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      // End reconnecting on a specific error and flush all commands with a individual error 
      console.log('Fail to connect to Redis !');
    }
    return 3000;
  }
});
//redis_cli.on('error', function(err){console.log(err)});  //Publish quelque part ???

const key    = 'dessert';
    
const PRIVILEGES = {
  ADMIN_USER:"ADMIN_USER",
  SIMULATOR:"SIMULATOR",
  MODERATOR:"MODERATOR",
  USER:"USER"
}
Object.freeze(PRIVILEGES);


let users = {}

function crypt(pwd){
  let hash = crypto.createHmac('sha512', key);
  hash.update(pwd);
  return hash.digest('hex');
}

exports.getUsers = function(){
  return users;
}

exports.login = function(username, password, client, callback){
 
  redis_cli.get(username, function(err, reply){
    let userJSON;
    try{
      userJSON = JSON.parse(reply)
    }catch(e){
      callback(null,false)
    }

    if(userJSON != null){
      //Ajouter le try catch du
      if(userJSON.password==crypt(password)){
        client.username = username;
        client.privilege = userJSON.privilege;
        callback(null,true)
      }else{
        callback(null,false)
      }
    }else{
      callback(null,false)
    }   
  });
}

//Fonction à enlever plus tards
exports.reset = function(){    

  let password = crypt("admin");
  let privilege = PRIVILEGES.ADMIN_USER;

  redis_cli.set("admin", `{"password":"${password}","privilege":"${privilege}"}`)
}

//Necessite des données sous la forme {"method":"createUser","username":"name","password":"pwd","privilege":"privilege",}
exports.createUser = function(mqtt, payload){
  let response="";
  if(redis_cli == null){
    response = `{"success":false, "token":null, payload:"Redis is not connected"}`; 
  }
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
  console.log(response);
  if(!(payload.privilege in PRIVILEGES)){
    response = `{"success":false, "token":${payload.token}), payload:"this privilege does not exist"}`; 
  }

  if(response!=""){
    mqtt.publish({topic:"admin/event",payload:`${response}`})
    return false;
  }

  redis_cli.get(payload.username, function(err, reply){
    if(reply != null){
      response =`{"success":false, "token":${payload.token}, payload:"this username is ever used"}`
    }else{
      response = `{"success":true, "token":${payload.token}}`;
      redis_cli.set(`${payload.username}`, `{"password":${crypt(payload.password)},"privilege":${payload.privilege}}`);
    }
    mqtt.publish({topic:"admin/event",payload:`${response}`})
  }) 
}

exports.deleteUser = function(mqtt, payload){
  let response="";
  if(redis_cli == null){
    response = `{"success":false, "token":null, payload:"Redis is not connected"}`; 
  }
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

  redis_cli.get(payload.username, function(err, reply){
    if(reply == null){
      response = `{"success":false, "token":${payload.token}, payload:"this username does not exist"}`;
    }else{
      response = `{"success":true, "token":${payload.token}}`;
      redis_cli.del(payload.username)
    }
    mqtt.publish({topic:"admin/event",payload:`${response}`})
  }) 
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
