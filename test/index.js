
/**
 * test server, start from main drawsocket folder with `node test`
 * optional args IP and port to send messages to:
 * 
 *      `node test --ip=192.168.1.1 --port=4444`
 * 
 * if running in dev mode (with node_modules inside the root drawsocket pacakge folder)
 * 
 *      `node test --ip=192.168.1.1 --port=4444 -d`
 * 
 */

const drawsocket = require('./../drawsocket-server')

function getArgs () {
    const args = {};
    process.argv
        .slice(2, process.argv.length)
        .forEach( arg => {
        // long arg
        if (arg.slice(0,2) === '--') {
            const longArg = arg.split('=');
            const longArgFlag = longArg[0].slice(2,longArg[0].length);
            const longArgValue = longArg.length > 1 ? longArg[1] : true;
            args[longArgFlag] = longArgValue;
        }
        // flags
        else if (arg[0] === '-') {
            const flags = arg.slice(1,arg.length).split('');
            flags.forEach(flag => {
            args[flag] = true;
            });
        }
    });
    return args;
}

const args = getArgs();

console.log(args);

let node_path = typeof args.d !== "undefined" ?  './node_modules' : './..';
let send_ip =   typeof args.ip !== "undefined" ? args.ip : "127.0.0.1";
let send_port = typeof args.port !== "undefined" ? Number(args.port) : 7777;

drawsocket.init({
    node_path,
    http_port: 3004,
    enable_udp: true,
    udp_listen_port: 9999,
    udp_send_port: send_port,
    udp_send_ip: send_ip //<< IP address for message output from server
});

drawsocket.start();
