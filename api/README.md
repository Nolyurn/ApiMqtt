# proto-mqtt client

The proto-mqtt client is a wrapper for [MQTT.js](https://github.com/mqttjs/MQTT.js)
for easy interfacing with the proto-mqtt broker.

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

Belonging to your privileges, you can use three different classes : one
for each privilege. To connect to the broker, whatever is the class,
the procedure is the same :

```js
import {Client} from 'proto-mqtt-client'

let client = new Client("<proto-mqtt-broker_address>", {user:"user", password:"pass"});

// You can set callbacks on client events

client.on("<event_type>", callback);
```

Events fired depends on privilege type.

#### Admin

The Administrator has the privilege to create and delete users in the database,
with the privilege of his choice.

You can see the references on the [[Admin wiki page|Admin]].

#### Moderator

The moderator has the power to create sensors and to delete those ones.
He can specify the type, and the frequency for the simulated sensor.

You can see the references on the [[Moderator wiki page|Moderator]].

#### Client

The Client has the basic rights : those to connect to the values sent
by the simulator.

You can see the references on the [[Client wiki page|Client]].


### Examples

#### Admin

```js
import {Admin} from 'proto-mqtt-client';

let callbacks = {
    onSuccess : (message) => {
        console.log("Created user.");
    },
    onError : (message) => {
        console.log("Failed on user creation..");
    }
}

let client = new Admin("ws://127.0.0.1:8080", {user:"robert", password:"password123"});

client.createUser("billy", "bob", callbacks);
client.deleteUser("billy", callbacks);
```

#### Moderator

```js
import {Moderator} from 'proto-mqtt-client';

let callbacks = {
    onSuccess : (message) => {
        console.log("Created sensor.");
    },
    onError : (message) => {
        console.log("Failed on sensor creation..");
    }
}

let client = new Moderator("ws://127.0.0.1:8080", {user:"robert", password:"password123"});

client.createSensor(payload, callbacks);
client.deleteSensor(name, callbacks);
```

#### Client

```js
import {Client} from 'proto-mqtt-client';

let client = new Client("ws://127.0.0.1:8080", {user:"robert", password:"password123"});

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
