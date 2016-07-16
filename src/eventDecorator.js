'use strict';

const EventEmitter = require('events');

/**
 * @param {Function} requester
 * @param {Object} [opts]
 * @param {EventEmitter} [opts.emitter]
 */
module.exports = function(requester, opts) {
  const emitter = (opts && opts.emitter) || new EventEmitter();
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
