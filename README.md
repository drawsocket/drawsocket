
# Drawsocket

`drawsocket` is an node.js based server/client platform for generating synchronized, browser-based displays across an array of networked devices.

Developed at the Hochschule für Musik und Theater Hamburg in 2019 for a series of [large scale concerts in the St.Pauli-Elbtunnel as part of the Innovative Hochschule Stage_2.0 project](https://www.hfmt-hamburg.de/innovative-hochschule/zm4/symphonie-im-st-pauli-elbtunnel/?L=0), `drawsocket` was conceived as a system for distributed notation display over a local area network for use in music and spatial performance contexts.

`drawsocket` provides a unified interface for controlling diverse media features of web-browsers (SVG, WebAudio, animation, etc.), which can be utilized in many ways--and additionally provides access to browser mouse and multi-touch gesture interaction data, which can be used for the creating of graphical user interfaces.

For more information, please see the documentation website at [drawsocket.github.io](https://drawsocket.github.io/)

# Installation

`drawsocket` can be run either as a [standalone server](#standalone-udp-server), or inside the [Max](https://cycling74.com/) media programming application.

# Max Package

Requires [Max](https://cycling74.com/) version >= 8.1.0, and [CNMAT's Odot library](https://github.com/CNMAT/CNMAT-odot/releases), and works well in the [MaxScore](http://www.computermusicnotation.com) notation framework.

__To install:__
1. Download the latest Max Package release from the [drawsocket-max](https://github.com/drawsocket/drawsocket-max) repository.
2. Unzip the downloaded release folder.
3. Place the `drawsocket` repository in the `/Documents/Max 8/Packages` folder.
4. Restart Max.
5. Make a new patcher and put a `drawsocket` object (abstraction) in the patcher, and go to the `drawsocket` help patch.
6. When running the `drawsocket` server for the first time: click on the `script npm install` message to download the `drawsocket` module and dependency libraries (note that you will need to be connected to the internet for the download to work).
7. Refer to the examples in the `drawsocket` help file, and in the Max Extras menu.
8. See the [Overview](overview.html) and [API](api.html) pages for more details.

# Pure Data

Using the standalone UDP server, the [odot](https://github.com/CNMAT/CNMAT-odot/releases/tag/1.3.0-rc.3) Pd library you can send `drawsocket` compatible OSC bundles. See also the [pd-communicate.pd](https://github.com/drawsocket/drawsocket/blob/main/example/pd-communication.pd) patch in the `drawsocket/example` folder.

# Standalone UDP Server

1. Install [node.js](https://nodejs.org/en/) if not already installed.
2. Create a new directory and run: `npm install drawsocket`
3. The `drawsocket` server can then be run by importing the module, initializing the server with `drawsocket.init()`, and starting with `drawsocket.start()`. 
4. Initializing the server with the option `enable_udp` set to `true` starts the HTTP server with an additional UDP server which will listen for incoming `drawsocket` format OSC bundles and route them to the client browsers via WebSockets.
5. See the [Overview](overview.html) and [API](api.html) pages for more details.

Minimal example:

```
const drawsocket = require('drawsocket');

drawsocket.init({
    node_path: './node_modules/',
    http_port: 3004,
    enable_udp: true,
    udp_listen_port: 9999,
    udp_send_port: 7777
});

drawsocket.start();

```

# Server Options

```
const drawsocket = require('drawsocket');

let params = {
    node_path: './node_modules/',               // path to node modules for client includes, default: `./..`
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

drawsocket.init(params);
drawsocket.start();
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