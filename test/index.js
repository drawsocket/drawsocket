
/**
 * test server, start from main drawsocket folder with `node test`
 * optional args IP and port to send messages to:
 * 
 *      `node test 192.168.1.1 4444`
 */


 const drawsocket = require('./../drawsocket-server')

 var args = process.argv.slice(2);
 
 let send_ip = args.length > 0 ? args[0] : "127.0.0.1";
 let send_port = args.length > 1 ? Number(args[1]) : 7777;
 
 drawsocket.init({
     node_path: './..',
     userpath: './',
     http_port: 3004,
     enable_udp: true,
     udp_listen_port: 9999,
     udp_send_port: send_port,
     udp_send_ip: send_ip //<< IP address for message output from server
 });
 
 drawsocket.start();
 