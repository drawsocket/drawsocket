const drawsocket = require('../drawsocket-server');

drawsocket.init({
    node_path: __dirname + '/node_modules/',
    userpath: __dirname,
    http_port: 3004,
    enable_udp: true,
    udp_listen_port: 9999,
    udp_send_port: 7777,
    udp_send_ip: "127.0.0.1" //<< IP address for message output from server
});

drawsocket.start();
