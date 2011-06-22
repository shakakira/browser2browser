(function(exports) {

  var b2b = exports;

  b2b.version = '0.0.1';

  var socket = null;

  var methods = {};

  var global_callback = null;

  b2b.register = function(id, fn) {
    if (typeof id === 'function') {
      // Only a callback specified, set the global callback
      global_callback = id;
    } else {
      methods[id] = fn;
    }
  };

  b2b.unregister = function(id) {
    delete methods[id];
  };

  b2b.send = function(dest, method, params, callback) {
    var obj = {};
    obj['dest'] = dest;
    obj['method'] = method;
    obj['params'] = params;
    socket.emit('message', obj, callback);
  }

  b2b.connect = function(id, host, forceNew) {
    socket = io.connect(host, forceNew); 
    socket.on('connect', function() {
      socket.emit('init', {'id': id});
    });

    socket.on('receive', function(obj) {
      var method = obj['method'];
      var callback = methods[method] || global_callback;
      if (callback) {
        callback.call({}, obj['params']);
      }
    });
  };

})('object' === typeof module ? module.exports : (window.b2b = {}));

