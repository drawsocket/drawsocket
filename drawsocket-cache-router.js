

const state_cache = require('./drawsocket-cache');
process.on("message", (_msg) => {
    
    switch(_msg.key)
    {
        case 'get':
        {
            const _state = state_cache.get(_msg.url);
            if( _state )
            {
                process.send({
                    url: _msg.url,
                    val: _state
                });
            }
            else
            {
                /*
                process.send({
                    msg: "no state for url?", 
                    keys: Array.from( state_cache.state.keys() )
                });
                */
            }
        }
        break;
        case 'set':
            state_cache.update(_msg.url, _msg.val, _msg.timetag);
        break;
        case "write":
        {
            try {
                let err = state_cache.writeToFile(_msg.val, _msg.url);
                if( err )
                    console.log("err", err);

            } catch (error) {
                console.log("uncaught error", error);
            }
            
        }
        break;
        case "read":
        {
            try {
                let err = state_cache.loadCache(_msg.val, _msg.url, process);
                if( err )
                    console.log("err", err);
                else
                {
                    // trigger update somehow
                }
            } catch (error) {
                console.log("uncaught error", error);
            }
            
        }
        break;
        default:
        break;    
    }

});