'use strict';

/**
 * @param {Function} requester
 * @param {Object} [opts]
 * @param {function(eventName, uri)} [opts.prefix] - generate log prefix
 * @param {function(data...)} [opts.loggers.info=console.info] - used for stdout logging (not erros)
 * @param {function(data...)} [opts.loggers.error=console.error] - used to log errors
 * @param {'info'|'error'|function(event)} [opts.events.[eventName]] - describes what happens for each eventName
 */
module.exports = function(requester, opts) {
  opts = typeof opts === 'object' ? opts : {};
  if (!(requester.plus && requester.plus.emitter)) {
    throw new Error('log requires an event emitter to be initialized first');
  }

  const prefixFunc = opts.prefix || (eventName => '[' + eventName + ']');

  const loggers = opts.loggers || {
    info: function(eventName, uri) {
      console.info(prefixFunc(eventName), uri);
    },
    error: function(eventName, uri) {
      console.error(prefixFunc(eventName), uri);
    },
    warn: function(eventName, uri) {
      console.warn(prefixFunc(eventName), uri);
    },
  };

  const events = opts.events || {
    request: 'info',
    response: 'info',
    fail: 'error',
    retryFail: 'error'
  };

  const emitter = requester.plus.emitter;

  for (let eventName in events) {
    if (typeof events[eventName] === 'string') {
      if (!loggers[events[eventName]]) {
        throw new Error('log action "' + events[eventName] + '"'
          + ' registered for event "' + eventName + '"'
          + ' but no logger is registered for this lo action'
        );
      }
      emitter.on(eventName, function() {
        const args = Array.prototype.slice.call(arguments);
        args.unshift(eventName);
        loggers[events[eventName]].apply(null, args);
      });
    } else {
      emitter.on(eventName, function() {
        const args = Array.prototype.slice.call(arguments);
        args.unshift(eventName);
        events[eventName].apply(null, args);
      });
    }
  }

  return requester;
};
