let crypto = require('crypto'),
	key    = 'dessert';
	

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
	if(username in users){
		if(users[username].password=crypt(password)){
			return true;
		}
	}
	return false;
}

exports.getUserRole = function(username){
	if(username in users){
		return users[username].role;
	}else{
		throw "user not found";
	}
}

//Fonction à enlever plus tards
exports.reset = function(){	
    users = [];
    users["admin"] = [];
    users["admin"].password = crypt("admin");
    users["admin"].role =ROLES.ADMIN_USER
}

//Necessite des données sous la forme {"method":"createUser","username":"name","password":"pwd","role":"role",}
exports.createUser = function(payload, username, password, role){
	if(!("username" in payload)){
		return "INVALID DATA : username field not found !"
	}
	if(!("password" in payload)){
		return "INVALID DATA : password field not found !"
	}
	if(!("role" in payload)){
		return "INVALID DATA : role field not found !"
	}

	//Test si l'utilisateur existe déjà, si il existe, l'ajout est impossible
	if(payload.username in users){
		return "The username is ever used !"
	}

	if(!(payload.role in ROLES)){
		return "Role does not exist !";
	}
	
	users[payload.username] = [];
	users[payload.username].password=crypt(payload.password); 
	users[payload.username].role=role; 

	return "user : "+payload.username+" created with success !";
}

exports.removeUser = function(payload){
	if(!("username" in payload)){
		return "INVALID DATA : username field not found !"
	}

	//Verifier si l'utilisateur existe
	if(payload.username in users){
		delete users[payload.username];
	}
	else{
		return "User not found !";
	}

	return "User : "+payload.username+" has been removed with success."
}

exports.setUserPassword = function(payload){
	if(!("username" in payload)){
		return "INVALID DATA : username field not found !"
	}
	if(!("password" in payload)){
		return "INVALID DATA : password field not found !"
	}

	if(payload.username in users){
		users[payload.username].password = crypt(payload.password);
	}else{
		return "User not found !";
	}
	return "Password of user : "+payload.username+" has been changed with success."
}


