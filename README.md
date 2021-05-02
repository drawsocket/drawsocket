
`drawsocket` is an node.js based server/client platform for generating synchronized, browser-based displays across an array of networked devices.

Developed at the Hochschule für Musik und Theater Hamburg in 2019 for a series of [large scale concerts in the St.Pauli-Elbtunnel as part of the Innovative Hochschule Stage_2.0 project](https://www.hfmt-hamburg.de/innovative-hochschule/zm4/symphonie-im-st-pauli-elbtunnel/?L=0), `drawsocket` was conceived as a system for distributed notation display over a local area network for use in music and spatial performance contexts.

`drawsocket` provides a unified interface for controlling diverse media features of web-browsers (SVG, WebAudio, animation, etc.), which can be utilized in many ways--and additionally provides access to browser mouse and multi-touch gesture interaction data, which can be used for the creating of graphical user interfaces.

For more information, please see the documentation website at [drawsocket.github.io](https://drawsocket.github.io/)

# Use in Max
For use in Max, please use the [drawsocket-max](https://github.com/drawsocket/drawsocket-max) Max package.

# Basic usage in UDP mode

To install run: `npm install drawsocket`

The `drawsocket` server can then be started by importing the module and running `start`.

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