const redis  = require("redis"),
      crypto = require('crypto');

const REDIS_PORT = 6379; //Env docker

let dataStore = null;

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

exports.Redis = 
{   
  init : function(){
    dataStore = redis.createClient({  
      port:REDIS_PORT,
      retry_strategy: function (options) {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          // End reconnecting on a specific error and flush all commands with a individual error 
          console.log('Fail to connect to Redis !');
        }
        return 3000;
      }
    });
    let password = crypt("admin");
    let privilege = PRIVILEGES.ADMIN_USER;
    dataStore.set("admin", JSON.stringify({"password":password,"privilege":privilege}))
  },
  login : function(username, password, client, callback){
    dataStore.get(username, function(err, reply){
      let userJSON = null;
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
  },
  createUser : function(mqtt, payload){
    let response = "";
    if(dataStore == null){
      response = JSON.stringify({"success":false, "token":null, "payload":"Redis is not connected"}); 
    }
    dataStore.get(payload.username, function(err, reply){
      if(reply != null){
        response =JSON.stringify({"success":false, "token":payload.token, "payload":"this username is ever used"})
      }else{
        response = JSON.stringify({"success":true, "token":payload.token});
        dataStore.set(payload.username, JSON.stringify({"password":crypt(payload.password),"privilege":payload.privilege}));
      }
      mqtt.publish({topic:"admin/event",payload:response})
    }) 
  },
  deleteUser:function(mqtt, payload){
    if(dataStore == null){
      response = JSON.stringify({"success":false, "token":null, "payload":"Redis is not connected"}); 
    }
    dataStore.get(payload.username, function(err, reply){
      let response = ""
      if(reply == null){
        response = JSON.stringify({"success":false, "token":payload.token, "payload":"this username does not exist"});
      }else{
        response = JSON.stringify({"success":true, "token":payload.token});
        dataStore.del(payload.username)
      }
      mqtt.publish({topic:"admin/event",payload:response})
    }) 
  }
};

exports.RAM =
{
  init:function(){
    dataStore = [];
    let password = crypt("admin");
    let privilege = PRIVILEGES.ADMIN_USER;

    dataStore["admin"] = `{"password":"${password}","privilege":"${privilege}"}`
  },
  login : function(username, password, client, callback){
    let userJSON = null;
    if(username in dataStore){
      try{
        userJSON = JSON.parse(dataStore[username]);
      }catch(e){
        callback(null,false);
      }

      if(userJSON.password==crypt(password.toString())){
        client.privilege = userJSON.privilege;
        client.username = username;
        callback(null,true);
      } else {
          callback(null,false);
      }
    }else{
      callback(null,false);
    }
  },
  createUser : function(mqtt, payload){
    let response= "";

    if(payload.username in dataStore){
      response =`{"success":false, "token":${payload.token}, "payload":"this username is ever used"}`
    }else{
      response = `{"success":true, "token":${payload.token}}`;
      dataStore[payload.username] = [];
      dataStore[payload.username] = `{"password":"${crypt(payload.password)}","privilege":"${payload.privilege}"}`
    }
    mqtt.publish({topic:"admin/event",payload:`${response}`});
  },
  deleteUser:function(mqtt,payload){
    let response ="";

    if(!(payload.username in dataStore)){
      response = `{"success":false, "token":${payload.token}, "payload":"this username does not exist"}`; 
    }else{
      delete dataStore[payload.username];
      response = `{"success":true, "token":${payload.token}}`; 
    }
    
    mqtt.publish({topic:"admin/event",payload:`${response}`})
  }
}


/*
Object.prototype.Implements = function(interface)
{ 
    for(var property in interface)
    {
        if( typeof interface[property] != "string")
            continue;
 
        if(this[property]==undefined || typeof this[property] != interface[property] )
            return false;
    }
    return true;
};

let iDataAccess = 
{
  init:"function",
  createUser : "function",
  deleteUser : "function",
};
*/