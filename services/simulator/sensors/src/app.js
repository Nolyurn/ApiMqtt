import { SensorsSimulator } from './simulator';

/* Recover the parameters from the environment (typically set through Docker). */
let broker_host = process.env.BROKER_HOST;
let ws_port = process.env.WS_PORT;
let auth_user = process.env.SIM_USER;
let auth_pass = process.env.SIM_PASS;
let topics_start = process.env.SIM_TOPICS_START;
let topics_stop = process.env.SIM_TOPICS_STOP;
let topics_response = process.env.SIM_TOPICS_RESPONSE;
let topics_announce = process.env.SIM_TOPICS_ANNOUNCE;
let announce_freq = process.env.SIM_ANNOUNCE_FREQ;
let retry_freq = process.env.SIM_RETRY_FREQ;

/* Ensuring that the required parameters are here. */
for (let v of [broker_host, auth_user, auth_pass])
    if (v === undefined)
        throw Error('Missing parameters from the environment. ' +
            'Check that the following variables are set: ' +
            'BROKER_HOST, SIM_USER, SIM_PASS.');

/* Setting defaults. */
ws_port = ws_port === undefined ? 3000 : ws_port;
topics_start = topics_start === undefined ? 'sensor/start' : topics_start;
topics_stop = topics_stop === undefined ? 'sensor/stop' : topics_stop;
topics_response = topics_response === undefined ? 'sensor/event' : topics_response;
topics_announce = topics_announce === undefined ? 'sensor/announce' : topics_announce;
announce_freq = announce_freq === undefined ? 5 : announce_freq;
retry_freq = retry_freq === undefined ? 5 : retry_freq;

/* Setting callbacks: off we go! */
new SensorsSimulator(
    'ws://' + broker_host + ':' + ws_port,
    auth_user, auth_pass, announce_freq, retry_freq, {
        'start': topics_start, 
        'stop': topics_stop,
        'response': topics_response,
        'announce': topics_announce
    });
