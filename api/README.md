# API Proto MQTT

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
