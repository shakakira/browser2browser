var fs = require('fs'),
    sio = require('../../test/src/node_modules/socket.io');

exports.version = '0.0.1';

exports.listen = function (server, options, fn) {

  // TODO: Support the same server types as socket.io
  // TODO: There's probably a lot more to get static serving right.
  // TODO: Cache the file.
  // TODO: This can be refactored into a separate class.
  var oldListeners = server.listeners('request');
  server.removeAllListeners('request');
  server.on('request', function (req, res) {
    if (req.url.indexOf('browser2browser/client.js') != -1) {
      fs.readFile(__dirname + '/client.js', function(err, data) {
        if (err) {
          res.writeHead(500);
          res.end('Error serving browser2browser client.');
          return;
        }

        var headers = {
          'Content-Type': 'application/javascript' 
        , 'Content-Length': data.length
        };

        res.writeHead(200, headers);
        res.end(data, 'utf8');
      });
    } else {
      for (var i = 0, l = oldListeners.length; i < l; i++) {
        oldListeners[i].call(server, req, res);
      }
    }
  });

  var clients = {};
  var logicalClients = {};

  var io = sio.listen(server, options, fn);

  io.sockets.on('connection', function(socket) {
    var socketId = socket.id;
    // TODO: Do I have to keep a reference to the socket around?
    // Does socket.io provide an id -> socket map already?
    clients[socketId] = {socket: socket};

    socket.on('init', function(msg) {
      var id = msg.id;
      var arr = logicalClients[id] || [];
      arr.push(socketId);
      logicalClients[id] = arr;
      clients[socketId]['id'] = id;
      console.log(clients);
      console.log(logicalClients);
    });

    function findDest(dest) {
      // TODO: process as a regex?
      return logicalClients[dest];
    }

    socket.on('message', function(obj) {

      function findDest(dest) {
        // TODO: process as a regex?
        return logicalClients[dest];
      }

      var dest = obj['dest'];
      var arr = findDest(dest) || [];
      for (var i = 0; i < arr.length; i++) {
        var currId = arr[i];
        var currSocket = clients[currId].socket;
        currSocket.emit('receive', obj);
      }
    });

    socket.on('disconnect', function() {
      var client = clients[socketId];
      var arr = logicalClients[client.id];
      for (var i = 0; i < arr.length; i++) {
        if (arr[i] == socketId) {
          arr.splice(i, 1);
          if (arr.length == 0) {
            delete logicalClients[client.id];
          } else {
            logicalClients[client.id] = arr;
          }
          break;
	}
      }
      delete clients[socketId];
      console.log(clients);
      console.log(logicalClients);
    });
  });
};

