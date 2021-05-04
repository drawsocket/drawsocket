
`drawsocket` is an node.js based server/client platform for generating synchronized, browser-based displays across an array of networked devices.

Developed at the Hochschule für Musik und Theater Hamburg in 2019 for a series of [large scale concerts in the St.Pauli-Elbtunnel as part of the Innovative Hochschule Stage_2.0 project](https://www.hfmt-hamburg.de/innovative-hochschule/zm4/symphonie-im-st-pauli-elbtunnel/?L=0), `drawsocket` was conceived as a system for distributed notation display over a local area network for use in music and spatial performance contexts.

`drawsocket` provides a unified interface for controlling diverse media features of web-browsers (SVG, WebAudio, animation, etc.), which can be utilized in many ways--and additionally provides access to browser mouse and multi-touch gesture interaction data, which can be used for the creating of graphical user interfaces.

For more information, please see the documentation website at [drawsocket.github.io](https://drawsocket.github.io/)

# Use in Max
For use in Max, please use the [drawsocket-max](https://github.com/drawsocket/drawsocket-max) Max package.

# Basic usage in UDP mode

To install run: `npm install drawsocket`

The `drawsocket` server can then be run by importing the module and running `start`. 

Initializing the server with the option `enable_udp` set to `true` starts the HTTP server with an additional UDP server which will listen for incoming `drawsocket` format OSC bundles and route them to the client browsers via WebSockets.

```
const drawsocket = require('drawsocket');

drawsocket.init({
    node_path: __dirname + '/node_modules/',
    userpath: __dirname,
    http_port: 3004,
    enable_udp: true,
    udp_listen_port: 9999,
    udp_send_port: 7777
});

drawsocket.start();

```

Using the [odot](https://github.com/CNMAT/CNMAT-odot/releases/tag/1.3.0-rc.3) Pd library you can send `drawsocket` compatible OSC bundles.
See also the `pd-communicate.pd` patch in the /example folder.

# Server Options

```
let params = {
    node_path: __dirname + '/node_modules/',    // path to node modules for client includes
    userpath: null,                             // path for custom asset serving folder
    htmltemplate: '/lib/drawsocket-page.html',  // sets main drawsocket page, /lib/drawsocket-page.html is the default
    infopage: "/lib/drawsocket-info.html",      // sets landing page, /lib/drawsocket-info.html is the default
    http_port: 3002,                            // sets HTTP port, 3002 by default
    post: "default",                            // by default, console.log, otherwise settable to other print function (e.g. Max.post)
    outlet: "default",                          // by default, if UDP is enabled outlet will be set to use udp_server.send, else disabled
    enable_udp: false,                          // enable/disable UDP server, off by default
    udp_listen_port: 9999,                      // UDP listen port
    udp_send_port: 7777,                        // UDP send-to port
    udp_send_ip: "127.0.0.1"                    // UDP send-to IP address
}
```

# Test Server

A test HTTP/UDP server can be run from within the `node_modules/drawsocket` folder, by running `node test`.

Optional arguments set UDP send-to IP and port, for example: 

```
node test --ip=192.168.0.1 --port=4444
```

For testing `drawsocket` from the repository, use the `-d` flag to set the path to `node_modules`:

```
node test --ip=192.168.0.1 --port=4444 -d 
```