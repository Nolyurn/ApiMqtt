const crypto = require('crypto')
  , redis  = require("redis");


let redis_cli = null;

redis_cli = redis.createClient();
redis_cli.on('error', function(err){console.log("Fail to connect to Redis !")});  //Publish quelque part ???

const key    = 'dessert';
    
const ROLES = {
  ADMIN_USER:"ADMIN_USER",
  SIMULATOR:"SIMULATOR",
  MODERATOR:"MODERATOR",
  USER:"USER"
}
Object.freeze(ROLES);


let users = {}

function crypt(pwd){
  let hash = crypto.createHmac('sha512', key);
  hash.update(pwd);
  return hash.digest('hex');
}

exports.getUsers = function(){
  return users;
}

exports.login = function(username, password){
  let userJSON;

  redis_cli.get(username, function(err, reply){
    userJSON = reply

    if(userJSON != null){
      console.log(crypt(password))
      console.log(JSON.parse(userJSON).password)
      if(JSON.parse(userJSON).password==crypt(password)){
        //true
      }
    }
    //false
  });
}

exports.getUserRole = function(username){
  if(redis_cli.get(username)==null){
      throw "user not found";
  }else{
      
    return JSON.parse(redis_cli.get(username)).role;
  }
}

//Fonction à enlever plus tards
exports.reset = function(){    

  let password = crypt("admin");
  let role = ROLES.ADMIN_USER;

  redis_cli.set("admin", `{"password":"${password}","role":"${role}"}`)
}

//Necessite des données sous la forme {"method":"createUser","username":"name","password":"pwd","role":"role",}
exports.createUser = function(payload){
  if(!("token" in payload)){
    return `{sucess:false, token:null, payload:"no token in payload"}`; 
  }
  if(!("username" in payload)){
    return `{sucess:false, token:$(payload.token), payload:"no username in payload"}`; 
  }
  if(!("password" in payload)){
    return `{sucess:false, token:$(payload.token), payload:"no password in payload"}`; 
  }
  if(!("role" in payload)){
    return `{sucess:false, token:$(payload.token), payload:"no role in payload"}`; 
  }

  if(!(payload.role in ROLES)){
    return `{sucess:false, token:$(payload.token), payload:"this role does not exist"}`; 
  }

  //Test si l'utilisateur existe déjà, si il existe, l'ajout est impossible (une option force dans le payload pourrait être à prévoir)
  if(redis_cli.get(payload.username)!=null){
    return `{sucess:false, token:$(payload.token), payload:"this username is ever used"}`; 
  }

  redis_cli.set('admin', `{"password":${crypt(payload.password)},"role":${payload.role}}`)

  return `{sucess:true, token:payload.token}`;
}

exports.deleteUser = function(payload){
  if(!("token" in payload)){
    return `{sucess:false, token:null, payload:"no token in payload"}`; 
  }
  if(!("username" in payload)){
    return `{sucess:false, token:$(payload.token), payload:"no username in payload"}`; 
  }

  //Verifier si l'utilisateur existe
  if(redis_cli.get(payload.username)==null){
    return `{sucess:false, token:$(payload.token), payload:"this username does not exist"}`; 
  }

  redis_cli.del(payload.username)

  return `{sucess:true, token:payload.token}`;
}

exports.updateUser = function(payload){
   if(!("token" in payload)){
    return `{sucess:false, token:null, payload:"no token in payload"}`; 
  }
  if(!("username" in payload)){
    return `{sucess:false, token:$(payload.token), payload:"no username in payload"}`; 
  }
  
  //prendre le payload, le modifier et faire un set


  return `{sucess:true, token:payload.token}`;
}