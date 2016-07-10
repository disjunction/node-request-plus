const EventEmitter = require('events');

const cacheDecorator = require('./cacheDecorator');
const retryDecorator = require('./retryDecorator');

module.exports = function(requester) {
  const emitter = new EventEmitter();
  const emit = emitter.emit.bind(emitter);

  function me(uri, requestOptions, callback) {
    emit('request', uri, requestOptions, callback);
    return requester(uri, requestOptions, callback)
    .then(body => {
      emit('response', body, uri, requestOptions, callback);
      return body;
    })
    .catch(error => {
      emit('error', error, uri, requestOptions, callback);
      throw error;
    });
  }

  me.emitter = emitter;
  me.retry = opts => requester = retryDecorator(requester, opts);
  me.cache = opts => requester = cacheDecorator(requester, opts);

  return me;
};
