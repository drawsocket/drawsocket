/*jslint es6:true*/

/*

MIT License

Copyright (c) 2019 Rama Gottfried, Hochschule für Musik und Theater Hamburg

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

'use strict';

const cluster = require('cluster');

process.env.NODE_ENV = "production";

const fs = require('fs');
const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const compression = require('compression');
const WebSocket = require('ws');

const app = express();
const path = require('path');

const udp_server = require('./drawsocket-udp');
const clients = require('./drawsocket-clientmanager');

cluster.setupMaster({ 
    exec: __dirname + '/drawsocket-cache-router.js'
});

let usr_root_path =  __dirname;
let usr_template = false;

let post = console.log;
let outlet = (msg) => {};

let params = {
    node_path: "./..",
    userpath: null,
    htmltemplate: '/lib/drawsocket-page.html',
    infopage: "/lib/drawsocket-info.html",
    http_port: 3002,
    post: "default",
    outlet: "default",
    enable_udp: false,
    udp_listen_port: 9999,
    udp_send_port: 7777,
    udp_send_ip: "127.0.0.1"
}


const stringifyOBJAsync = (obj_) => {
    return Promise.resolve().then( ()=> JSON.stringify(obj_) );
}

const wrapTimetag = (obj_, timetag_) => {
    if( Array.isArray(obj_) )
    {
        return {
            timetag: timetag_,
            obj_arr: obj_
        };
    }
    else
    {
        obj_.timetag = timetag_;
        return obj_;
    }
    
}



function initPaths()
{

    if ( params.userpath ) {
        let usr_path_absolute = path.normalize( path.isAbsolute(params.userpath) ? params.userpath : path.resolve('./', params.userpath) );
        app.use( express.static( usr_path_absolute ) );
        usr_root_path = usr_path_absolute + (usr_path_absolute[usr_path_absolute.length-1] != '/' ? '/' : '' );
    
        post("adding user html root path " + usr_root_path);
    }
    
    app.use( compression() );
    
    app.use(bodyParser.urlencoded({ extended: true }));
    
    // these files are in the package not the user root_path
    let modules_path = path.normalize( path.isAbsolute(params.node_path) ? params.node_path : path.resolve('./', params.node_path) );
    post("setting node_modules path for client scripts " + modules_path);

    // these files are in the package not the user root_path
    app.use('/scripts', express.static(modules_path));

    app.use('/lib', express.static(__dirname + '/lib/')); // client js and css files
    app.use('/fonts', express.static(__dirname + '/lib/fonts/')); // client js and css files
    
    // new system: use the same page for everything, and allow users to just set the OSC prefix by the URL
    app.use('*', (req, res) => {
    
        if( !usr_template )
        {
            if (req.baseUrl == "")
                res.sendFile(__dirname + params.infopage);
            else
                res.sendFile(__dirname + params.htmltemplate);
        }
        else
        {
            if (req.baseUrl == "")
            {
                res.sendFile( path.resolve( usr_root_path + params.infopage) );
            }
            else 
            {
                res.sendFile( path.resolve( usr_root_path +  params.htmltemplate) );
            }
        }
        
    });
    
    
    app.get('/', (req, res) => {
        post('express connection ' + req + ' ' + res);
    });
    
    
    app.post('/form-post', (request, response) => {
        outlet(request.body);
        return response.send(request.body);
    });
    
}


// var env = process.env.NODE_ENV || 'development';
// if ('development' == env) {
//     console.log('dev mode');
// }



const server = http.createServer(app);

// setup sockets
const wss = new WebSocket.Server({
    server: server
});

wss.setMaxListeners(200);

    /**
 * main entry point for messages from Max to Client
 * new address format:
 *  
 *    
 * {
    /prefix : [{
        key : unique key type,
        val: [ {} {}, array of values with optional timetag, unioned by id ]
    } , {
        key : unique key type,
        val: [ {} {}, array of values with timetag, unioned by id ]
    }]
}
* 
* note that all wildcards are handled first and then specific names.
* 
* adding timetag for incoming dict since these are in sync
* then the cache will add the timetags into the internal objects since these could have different start times
* 
*/

/**
 * 
 * @param {Object} in_obj main input process, routes to clients and adds to cache
 * 
 */
const processInputObj = function(in_obj) {

    const timetag_ = Date.now();

    for (const _prefix in in_obj) 
    {
        const addr = _prefix[0] != "/" ? "/" + _prefix : _prefix; //annoying that o.dict strips leading / !

        if (addr === "/*") {
            let obj_ = in_obj[_prefix];

            if( typeof obj_ !== 'object' )
            {
                post(`syntax error, value must be an object. Received  message ${obj_}`);
                continue;    
            }

            stringifyOBJAsync( wrapTimetag(obj_, timetag_) )
                .then( result => clients.sendToALL(result) );
            
            if( !obj_.hasOwnProperty('cache') || obj_.cache == 1 )
            {
                cache_proc.send({
                    key: 'set',
                    url: addr,
                    val: obj_,
                    timetag: timetag_
                });
            }
            

        }
        else if ( addr === "/drawsocket/server" ) 
        {
            /*
                /drawsocket/server : ["writecache", "foobar.json"]
            */
            let obj_ = in_obj[_prefix];

            if( !Array.isArray(obj_) && typeof obj_ === 'object' )
            {
                post(`syntax error, messages to the drawsocket server must be strings or lists. Received  message ${obj_}`);
                continue;    
            }

            obj_ = Array.isArray(obj_) ? obj_ : [ obj_ ];
            const k = obj_[0];
            const args = obj_.slice(1); 

            switch( k )
            {
                case "writecache":
                    if( args.length == 1 )
                        writeCache(args);
                    else if( args.length == 2 )
                        writeCache(args[0], args[1]);
                    else
                        writeCache('saved_cache.json')
                break;
                case "importcache":
                    if( args.length == 1 )
                        importCache(args)
                    else if( args.length == 2 )
                        importCache(args[0], args[1])
                    else
                        post("error, no file specified for importcache");
                break;
                case "html_template":
                    setTemplate(args);
                break;
                case "statereq":
                    stateReq(args);
                break;
                case "ping":
                    ping(args);
                break;
                default:
                break;
            }
            
        }
        else 
        {

            let obj_ = in_obj[_prefix];

            stringifyOBJAsync( wrapTimetag(obj_, timetag_) )
                .then( result => clients.sendToClientsURL( addr, result ) );
            
            if( !obj_.hasOwnProperty('cache') || obj_.cache == 1 )
            {
                cache_proc.send({
                    key: 'set',
                    url: addr,
                    val: obj_,
                    timetag: timetag_
                });
            }
        }

    }
}

udp_server.receive_callback( (obj) => {
    processInputObj(obj); 
});


// pretty sure this is never called
wss.on("close", function (socket, req) {
    const uniqueid = req.headers['sec-websocket-key'];
    const _url = req.url;

    console.log('received wss socket close', _url, uniqueid);
        
    clients.removeClient(_url, uniqueid);
    socket.terminate();
    
});

// create OSC websockets from vanilla websockets, and add to clients list
wss.on("connection", function (socket, req) {

    const uniqueid = req.headers['sec-websocket-key'];
    const _url = req.url;
    const _ip = req.connection.remoteAddress;

    const clientInfo = {
        url: _url,
        ip: _ip,
        uniqueid: uniqueid
    }

    const disconnectionMsg = {
        event: {
            from: clientInfo,
            key: 'status',
            val: {
                connected: 0
            }
        }
    };
    

//        post("A Web Socket connection has been established! " + req.url + " (" + uniqueid + ") " + req.connection.remoteAddress);

    // setup relay back to Max
    socket.on("message", function (msg) {
        try {

            const obj = JSON.parse(msg);

            let key = obj.hasOwnProperty('key') ? obj.key : Object.keys(obj)[0]; // use first key if not using standard format

            if (key === 'timesync') {
                socket.send(JSON.stringify({
                    timesync: {
                        id: (typeof obj.timesync.id == "undefined") ? null : obj.timesync.id,
                        result: Date.now()
                    }
                }));

            }
            else if (key === 'statereq') 
            {
                cache_proc.send({
                    key: 'get',
                    url: _url
                });
                
            }
            else if(key === 'svgElement' && obj.hasOwnProperty("val"))
            {

                let _prefix = req.url.slice(1);
                const filename = usr_root_path + 'downloaded-'+_prefix+'.svg';
                stringifyOBJAsync(obj.val)
                    .then( (jsonStr) => {
                        post('writing file: '+ filename);

                        fs.writeFile( filename, 
                            jsonStr.slice(1,-1)
                                .replace(/\\"/g, '"')
                                .replace(/\\n/g, '')
    //                            .replace('xlink=', 'xmlns:xlink=')
                                .replace(/NS\d+:href/gi, 'xlink:href'), 
                            (err) => {
                                if(err) {
                                    return post(err);
                                }
                            }
                        );

                        outlet({
                            'outfile': filename 
                        });
                    });

                
            }
            else if( key == 'getPeers')
            {
                stringifyOBJAsync({
                    key: 'peers',
                    val: clients.getPeers(_url),
                    timetag: Date.now()
                }).then( jsonStr => {
                    socket.send(jsonStr);
                })
            }
            else if( key == "signalPeer")
            {
                /*
                    {
                        key: 'peerSignal',
                        url: send to URL,
                        val: content
                    }
                */
            //     console.log( "signalPeer", obj );

                if( obj.hasOwnProperty('url') )
                {

                    const timetag = Date.now();

                    stringifyOBJAsync({
                        from: clientInfo,
                        timetag,
                        ...obj.val
                    }).then( jsonStr => {

                        if( Array.isArray(obj.url) )
                        {
                            obj.url.forEach( addr => clients.sendToClientsURL(addr, jsonStr) )
                        }
                        else if( obj.url == "/*" )
                        {
                            clients.sendToALL( jsonStr );
                        }
                        else
                        {
                            clients.sendToClientsURL(obj.url, jsonStr );
                        }

                        if( !obj.hasOwnProperty('cache') || obj.cache == 1 )
                        {
                            //  post("setting cache", obj.val)
                            cache_proc.send({
                                key: 'set',
                                url: obj.url,
                                val: obj.val,
                                timetag
                            });
                        }

                    })

                }

            }
            else
            {
                obj.from = clientInfo;
                outlet(obj);
            }
                

        } catch (e) {

            post("json failed to parse " + e);
        }

    });

    socket.on("close", function () { // event

        console.log('received socket close', _url, uniqueid);
        
        clients.removeClient(_url, uniqueid);
        socket.terminate();
        
        outlet(disconnectionMsg);

//            post("closed socket : " + uniqueid + " @ " + req.url);

    });

    socket.on("error", function (event) {
        clients.removeClient(_url, uniqueid);
        
        post("error on socket : " + uniqueid + " @ " + _url);
        post(event);
    });

    clients.saveClient(socket, uniqueid, _url);

});


/**
 * API functions
 */

/**
 * 
 * @param {String} template name of file to use for template (currently uses path relative to root folder)
 */
const setTemplate = (template) => {
    params.htmltemplate = template;
    usr_template = true;
    post("set html template page to " + usr_root_path + template);
}

/**
 * 
 * @param {String} filename file name of JSON file to save, full path or relative to root folder
 * @param {String} prefix optional OSC prefix to save only one client URL from the cached data
 */
const writeCache = (filename, prefix) => {

    post("attempting to save", filename, ( prefix ? prefix : "" )); 
    
    cache_proc.send({
        key: 'write',
        url: prefix,
        val: ( path.isAbsolute(filename) ? filename : usr_root_path+filename )
    });
}

/**
 * 
 * @param {String} filename file name of JSON file to load, full path or relative to root folder
 * @param {String} prefix optional OSC prefix to save only one client URL from the cached data
 */
const importCache = (filename, prefix) => {

    if( !filename )
    {
        post("importcache error, missing filename");
        return;
    }
    
    const fullpath = path.normalize( path.isAbsolute(filename) ? filename : path.resolve(usr_root_path, filename) );
    post("attempting to import", fullpath, ( prefix ? prefix : "" ) );
    cache_proc.send({
        key: 'read',
        url: prefix,
        val: fullpath 
    });
}

/**
 * 
 * @param {String} prefix OSC URL of client to ping, client returns connection information via send port
 */
const ping = (prefix) => {
    //console.log(prefix, prefix.length, Array.isArray(prefix) );
    for( const _prefix of prefix )
    {
        if( _prefix === "/*" )
        {
            stringifyOBJAsync({
                ping: 1
            }).then( result => clients.sendToALL(result) );
        }
        else
        {
            stringifyOBJAsync({
                ping: 1
            }).then( result => clients.sendToClientsURL(_prefix, result) );
        }
    }
}

/**
 * 
 * @param {String} prefix sends message to client that it should request the cached state for its URL, used after loading new cache from disk.
 * 
 */
const stateReq = (prefix) => {
    //post(prefix, prefix.length, Array.isArray(prefix) );
    for( const _prefix of prefix )
    {
        if( _prefix === "/*" )
        {
            stringifyOBJAsync({
                statereq: 1
            }).then( result => clients.sendToALL(result) );
        }
        else
        {
            stringifyOBJAsync({
                statereq: 1
            }).then( result => clients.sendToClientsURL(_prefix, result) );
        }
    }
}




// helper func
let getIPAddresses = function () {
    let os = require("os"),
        interfaces = os.networkInterfaces(),
        ipAddresses = [];

    for (let deviceName in interfaces) {
        let addresses = interfaces[deviceName];

        for (let i = 0; i < addresses.length; i++) {
            let addressInfo = addresses[i];

            if (addressInfo.family === "IPv4" && !addressInfo.internal) {
                ipAddresses.push(addressInfo.address);
            }
        }
    }

    return ipAddresses;
};

server.on('uncaughtException', function (err) {
    post("xx" + err);

    if (err.errno === 'EADDRINUSE')
        post('EADDRINUSE');
    else
        post("uncaught exception! we should not receive this! => " + err);
});

server.on('error', (e) => {
    post("*** got error");
    if (e.code === 'EADDRINUSE') {
        post('Address in use, retrying...');
        /*
        setTimeout(() => {
        server.close();
        server.listen(PORT, HOST);
        }, 1000);
        */
    }
    else
    {
        post("server error", e);
    }
});

/*
let myErrorHandler = function(err, req, res, next){
    // note, using the typical middleware pattern, we'd call next() here, but
    // since this handler is a "provider", i.e. it terminates the request, we
    // do not.
    post("yo "+err);
};

app.configure(function(){
    app.use(myErrorHandler);
});
*/

process.on('unhandledRejection', (reason, p) => {
    post('Unhandled Rejection at:', p, 'reason:', reason);
    // Application specific logging, throwing an error, or other logic here
});



const init = function(obj) {
    if( typeof obj.htmltemplate != "undefined" && obj.htmltemplate !== params.htmltemplate )
    {
        usr_template = true;
        // actually set in union below
    }
    
    params = {
        ...params,
        ...obj
    }

    if( params.post != "default" )
    {
        post = params.post;
    }

    if( params.outlet != "default" )
    {
        outlet = params.outlet;
    }

    initPaths();
}

const start = function()
{
    // start server
    server.listen(params.http_port, () => {
        let port = server.address().port;
        post('load webpage at', 'http://localhost:' + port);
        post('or', 'http://' + getIPAddresses() + ':' + port);
        outlet({
            "/port/localhost": 'http://localhost:' + port,
            "/port/ip": 'http://' + getIPAddresses() + ':' + port
        });
    });

    if( params.enable_udp )
    {
        console.log("starting udp server");

        udp_server.init( params.udp_listen_port, params.udp_send_port, params.udp_send_ip );
        if( params.outlet == "default" )
        {
            outlet = udp_server.send;
        }
    }

}

function stop()
{
    console.log('stop');
}




const cache_proc = cluster.fork();

cache_proc.on('message', (msg)=> {

    if( msg.url )
    {
        clients.sendToClientsURL(msg.url, msg.val);
    }
    else if( msg.output )
    {
        outlet(  msg.output );
    }
    else
        post( msg );

});

module.exports = {

    setTemplate,
    writeCache,
    importCache,
    ping,
    stateReq,
    processInputObj,
    start,
    stop,
    init

}

