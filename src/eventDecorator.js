const EventEmitter = require('events');

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

  requester.plus.emitter = emitter;
  return me;
};
