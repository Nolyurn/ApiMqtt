# Docker infrastructure for the MQTT service #

This directory is split into 4 parts:

- The `mqtt/` directory hosts the Mosca MQTT broker. It handles topics, authentication, and so on.
- The `simulator/` directory hosts the simulation service, an MQTT client with special privileges granted by the broker.
- The `redis/` directory contains a custom Redis configuration to suit the broker's needs.
- The `integration/` directory defines a container used for integration tests, and isn't part of the base infrastructure.

## Starting the service ##

Typically, the service can be started by running:

    $ docker-compose up --build

This will start the MQTT broker first along with its Redis database, then the simulation service.

## Development ##

At the moment, the broker code is expected to be at `mqtt/server/`. The simulator is at `simulator/sensors/`.
The `mqtt/` and `simulator/` directories are Docker contexts, which you can tweak based on what you need when developing.
At present, the `Dockerfile`s do as follows:

1. Start from a fresh `node` base.
2. Copy the code from `server/` or `sensors/` to the container.
3. Install `webpack` on the container.
4. Run `npm install` and `npm run build`.
5. Start the service with `npm start`.

Use the `scripts` section of your `package.json` files to define `build` based on what you need.
You should also define the `start` and `test` scripts (your code **must** pass all unit tests for the build to be successful).
Feel free to edit your `Dockerfile` if you require more setup (beyond your `package.json` file).

If you want to work on your code through Docker, use the following to get a node environment for the project:

    $ cd mqtt/server
    $ docker run -ti -v $PWD:/home/node/server node /bin/bash

Once inside your container, you may need to install `webpack` and use the `node` user:

    # npm install -g webpack
    # su node
    $ cd ~/server

Then you may initialise your project, build or start it:

    $ npm init
    $ npm install
    $ npm run build
    $ npm start
    $ ...

# Integration #

The `integration` directory defines a special container, which can be started with:

    $ docker-compose up --build -f docker-integration.yml

**This original infrastructure must be running for this to work!** If so the container will start and attach itself to the existing infrastructure's network. It will then execute a set of integration tests over all components, and exit.
