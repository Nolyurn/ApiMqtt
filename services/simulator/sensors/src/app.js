import { SensorsSimulator } from './simulator';

/* Recover the parameters from the environment (typically set through Docker). */
let broker_host = process.env.BROKER_HOST;
let broker_port = process.env.BROKER_PORT;
let auth_user = process.env.AUTH_USER;
let auth_pass = process.env.AUTH_PASS;
let topics_start = process.env.TOPICS_START;
let topics_stop = process.env.TOPICS_STOP;
let topics_events = process.env.TOPICS_EVENTS;
let topics_announce = process.env.TOPICS_ANNOUNCE;
let announce_freq = process.env.ANNOUNCE_FREQ;

/* Ensuring that the required parameters are here. */
for (let v of [broker_host, auth_user, auth_pass])
    if (v === undefined)
        throw Error('Missing parameters from the environment. ' +
            'Check that the following variables are set: ' +
            'BROKER_HOST, AUTH_USER, AUTH_PASS.');

/* Setting defaults. */
broker_port = broker_port === undefined ? 9000 : broker_port;
topics_start = topics_start === undefined ? 'sensors/start' : topics_start;
topics_stop = topics_stop === undefined ? 'sensors/stop' : topics_stop;
topics_events = topics_events === undefined ? 'sensors/events' : topics_events;
topics_announce = topics_announce === undefined ? 'sensors' : topics_announce;
announce_freq = announce_freq === undefined ? 5 : announce_freq;

/* Setting callbacks: off we go! */
new SensorsSimulator(
    'mqtt://' + broker_host + ':' + broker_port,
    auth_user, auth_pass, announce_freq, {
        'start': topics_start, 
        'stop': topics_stop,
        'events': topics_events,
        'announce': topics_announce
    });
