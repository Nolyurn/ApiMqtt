let http     = require('http')
  , httpServ = http.createServer()
  , mosca    = require('mosca');


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
  console.log('Mosca server is up and running')
}

mqttServ.authenticate = function(client, username, password, callback) {
    let authorized = (username === 'test' && password.toString() === 'test');
    if (authorized) client.user = username;
    callback(null, authorized);
}


module.exports = {
    server : mqttServ,
};