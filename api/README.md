# proto-mqtt client

The proto-mqtt client is a Javascript library for easy interfacing with
the proto-mqtt broker.

[![NPM](https://nodei.co/npm/proto-mqtt-client.png)](https://nodei.co/npm/proto-mqtt-client/)

## Use proto-mqtt client in your Node project

To use the proto-mqtt-client as a dependency in your project, put yourself
in the project folder, and then execute the following :

```bash
npm install --save proto-mqtt-client
```

## Use proto-mqtt client in a browser-sided project

In order to convert the Node JS library to a browser library, you'll need
to install browserify :

```bash
npm install -g browserify
```

Then clone the source, build it, and then browserify it where you want :

```bash
git clone https://github.com/Nolyurn/proto-mqtt
cd proto-mqtt/api
npm install
npm build
browserify dist/index.js -o bundle.js
```

And your `bundle.js` file is now ready to be used in your client-sided
applications.

## Usage



#### Administrateur

```js
import Admin from 'proto-mqtt';
let callback = {
    onSuccess: (message) => {
        console.log("Création de l'utilisateur " + message.username + " réussie !")
    },
    onError: (message) => {
        console.log("Erreur lors de la création de l'utilisateur " + message.username + ". Erreur : " + message.error)
    }
}
let client = Admin("ws://127.0.0.1:8080", {user:"robert", password:"password123"}, callback);

client.createUser("billy", "bob");
client.deleteUser("billy");
```

#### Simulateur

```js
import Simulateur from 'proto-mqtt';

let client = Simulateur("ws://127.0.0.1:8080", {user:"robert", password:"password123"});

client.on("create", (payload) => {
    // Code à exécuter quand vous recevez une instruction de création de capteur  
});

client.on("delete", (payload) => {
    // Code à exécuter quand vous recevez une instruction de suppression de capteur
});

client.publish("topic", {value:12, type:"POSITIVE_NUMBER"});
```

#### Modérateur

```js
import Moderateur from 'proto-mqtt';

let client = Moderateur("ws://127.0.0.1:8080", {user:"robert", password:"password123"});

client.createSensor(payload);
client.deleteSensor(name);
```

#### Client

```js
import Client from 'proto-mqtt';

let client = Client("ws://127.0.0.1:8080", {user:"robert", password:"password123"});

client.on("message", (topic, payload) => {
    // Le code quand vous recevrez un message
});

client.on("connect", (connack) => {
    // Le code quand vous vous connectez
});

client.on("reconnect", () => {
    // Le code quand une reconnexion a lieu
});

client.on("offline", () => {
    // Le code quand le client est hors ligne.
});

client.on("error", (error) => {
    // Renvoyée quand une erreur a lieu
});

client.subscribe("topic");

```
