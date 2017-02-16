The simulation service
======================

The simulator is a MQTT client which runs within the broker's cluster as an
additional service. Its role is to listen for sensor requests (start/stop) and
publish on the appropriate `value/...` topic regularly.

The service's configuration is done using the environment variables set in the
global `docker-compose.yml` file. The following parameters **must** be set:

- `BROKER_HOST` is the broker's hostname within the Docker compose cluster. This
is defined as `mqtt` by default, and there is little gain from changing it.
- `BROKER_PORT` is the broker's port, by default 9000. This is used by both the
simulator (connecting) and the broker (listening).
- `AUTH_USER` is the username which can be used to obtain simulator privileges
from the broker.
- `AUTH_PASS` is the associated password for this account.
- `TOPICS_START` is the topic on which to listen for creation requests. We
recommend keeping the default value since it is also a default for the API.
- `TOPICS_STOP` is the topic on which to listen for deletion requests (same
advice).
- `TOPICS_RESPONSE` is the topic on which to listen for request responses.
- `TOPICS_ANNOUNCE` is the topic on which the simulator will regularly publish
its list of sensors.
- `ANNOUNCE_FREQ` is the period (in seconds) at which the list is sent on the
announce topic.
