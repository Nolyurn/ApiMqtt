# API Proto MQTT

## Usage

#### Administrateur

```js
import Admin from 'proto-mqtt';

let client = Admin("ws://127.0.0.1:8080", {user:"robert", password:"password123"});
client.connect()

client.createUser("billy", "bob");
client.deleteUser(billy);
```

#### Simulateur

```js
import Simulateur from 'proto-mqtt';

let client = Simulateur("ws://127.0.0.1:8080", {user:"robert", password:"password123"});

client.onCreate = function(payload) {
    // Code à exécuter quand vous recevez une instruction de création de capteur  
}

client.onDelete = function(payload) {
    // Code à exécuter quand vous recevez une instruction de suppression de capteur
}

client.connect()

client.publish("topic", {value:12, type:"POSITIVE_NUMBER"});
```

#### Modérateur

```js
import Moderateur from 'proto-mqtt';

let client = Moderateur("ws://127.0.0.1:8080", {user:"robert", password:"password123"});
client.connect();

client.createSensor(payload);
client.deleteSensor(name);
```

#### Client

```js
import Client from 'proto-mqtt';

let client = Client("ws://127.0.0.1:8080", {user:"robert", password:"password123"});

client.onMessage = (topic, payload) => {
    // Le code quand vous recevrez un message
}

client.onConnect = (connack) => {

}

client.onReconnect = () => {

}

client.onOffline = () => {

}

client.onError = (error) => {

}

client.connect();

```
