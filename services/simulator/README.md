# The simulation service #

This service must be setup using the infrastructure's `docker-compose.yml` file before it can be run.
Use this file in order to set the following environment variables:

- `BROKER_HOST` : the hostname or IP to the MQTT broker.
- `AUTH_USER` : the simulator's username.
- `AUTH_PASS` : the associated password.

Other variables may be set but will fallback to defaults if they are not (see the file).
At the moment, the simulator can:

- Receive requests on `sensors/start` and `sensors/stop`.
- Simulate sensors at the requested intervals.

It doesn't handle its errors yet (fails silently), and the sensors model could be seriously improved.
