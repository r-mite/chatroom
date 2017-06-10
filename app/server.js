
/**
* httpサーバーのラッパー
**/
class Server {
    constructor() {
        this.app = require('./app');
        this.http = require('http');
        this.debug = require('debug')('chatroom:server');
    }
}

Server.prototype.listen = function(port) {
    function normalizePort(val) {
        var port = parseInt(val, 10);

        if (isNaN(port)) {
            // named pipe
            return val;
        }

        if (port >= 0) {
            // port number
            return port;
        }

        return false;
    }

    var port = normalizePort(process.env.PORT || port);
    this.app.set('port', port);
    this.server = this.http.createServer(this.app);

    this.server.listen(port);
    this.server.on('error', this.onError.bind(this));
    this.server.on('listening', this.onListening.bind(this));
    return this.server;
}

Server.prototype.onListening = function() {
    var addr = this.server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    this.debug('Listening on ' + bind);
}

Server.prototype.onError = function(error) {

    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

module.exports = Server;
