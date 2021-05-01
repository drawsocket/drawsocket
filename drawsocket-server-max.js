
const drawsocket = require('./drawsocket-server');

drawsocket.start();


/*
  
const argc = process.argv.length;
const userpath = argc > 2 ? process.argv.slice(2) : __dirname;
const in_template = argc > 4 ? process.argv[4] : "default";



      let Max, post, outlet;

      try {
          Max = require('max-api');
          post = Max.post;
          outlet = Max.outlet;
  
          post("started up ");
          post(`pid: ${process.pid}`);
          post(`running in ${process.env.NODE_ENV} mode`);
      }
      catch(err) 
      {
  
          udp_server.init();
  
          post = console.log;
          outlet = udp_server.send;
  
      }

      
      if( Max )
      {
          Max.addHandler("html_template", (args) => setTemplate(args) );
  
          Max.addHandler("writecache", (filename, prefix) => writeCache(filename, prefix) );
          
          Max.addHandler("importcache", (filename, prefix) => importCache(filename, prefix) );
      
          Max.addHandler("ping", (...prefix) => ping(prefix) );
      
          Max.addHandler("statereq", (...prefix) => stateReq(prefix) );
          
      
          Max.addHandler(Max.MESSAGE_TYPES.DICT, (dict) => {
              processInputObj(dict);
          });
      
      }
     
     */