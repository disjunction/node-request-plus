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
    emit('request', uri);
    return requester(uri, requestOptions, callback)
    .then(body => {
      emit('response', uri, body);
      return body;
    })
    .catch(error => {
      emit('fail', uri, error);
      throw error;
    });
  }

  requester.plus.emitter = emitter;
  return me;
};
