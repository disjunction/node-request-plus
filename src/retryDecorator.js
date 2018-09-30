'use strict';

/**
* @param {Function} requester
* @param {Object} [opts]
* @param {number} [opts.attempts] - max attempts to make before giving up
* @param {function(error: Error) : boolean} [opts.errorFiler] - returns true if we should retry
* @param {number|function(attempt) : number} [opts.delay = 500] - delay between retries (ms)
* @return {function(uri, requestOptions, callback): Promise}
*/
function me(requester, passedOpts) {
  const opts = Object.assign({},passedOpts);
  opts.attempts = opts.attempts !== undefined ? opts.attempts : 3;
  opts.errorFilter = opts.errorFilter || me.defaultErrorFilter;

  const emit = requester.plus && requester.plus.emitter
    ? requester.plus.emitter.emit.bind(requester.plus.emitter)
    : () => {};

  function getDelay(attempt) {
    if (!opts.delay) {
      return 500;
    }
    return opts.delay instanceof Function
      ? opts.delay(attempt)
      : opts.delay;
  }

  function rpWithRetry(uri, requestOptions, callback, attempt) {
    attempt = attempt || 1;
    emit('retryRequest', uri, attempt);
    return requester(uri, requestOptions, callback)
    .then(body => {
      if (attempt > 1) {
        emit('retryResponse', uri, body, attempt);
      }
      return body;
    })
    .catch(error => {
      emit('retryFail', uri, error, attempt);
      if (opts.errorFilter(error, uri, requestOptions)) {
        if (attempt <= opts.attempts - 1) {
          return new Promise(resolve => setTimeout(resolve, getDelay(attempt)))
          .then(() => rpWithRetry(uri, requestOptions, callback, attempt + 1));
        }
      }
      throw error;
    });
  }
  return rpWithRetry;
}

const retryCodes = [500, 502, 503, 504];

me.defaultErrorFilter = function (error, uri, requestOptions) { // eslint-disable-line
  return me.isRetriableNetworkError(error)
    || (retryCodes.indexOf(error.statusCode) >= 0);
};

// taken from requestretry with ENOTFOUND excluded
me.retriableNetworkErrors = [
  'ECONNRESET',
  'ESOCKETTIMEDOUT',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'EHOSTUNREACH',
  'EPIPE',
  'EAI_AGAIN'
];

me.isRetriableNetworkError = function(error) {
  return error
    && error.error
    && me.retriableNetworkErrors.indexOf(error.error.code) >= 0;
};

module.exports = me;
