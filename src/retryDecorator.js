function me(requester, opts) {
  opts = opts || {};
  opts.attempts = opts.attempts !== undefined ? opts.attempts : 3;
  opts.errorFilter = opts.errorFilter || me.defaultErrorFilter;
  opts.delay = opts.delay || 3000; // use 3 sec. delay between retries
  opts.transformDelay = opts.transformDelay || (attempt => opts.delay);

  const emitter = requester.emitter || {emit: () => {}};
  const emit = emitter.emit.bind(emitter);

  function rpWithRetry(uri, requestOptions, callback, attempt) {
    attempt = attempt || 1;
    emit('attempt', uri, requestOptions, callback, attempt);
    return requester(uri, requestOptions, callback)
    .then(response => {
      if (attempt > 1) {
        emit('attemptSucessful', uri, requestOptions, callback, attempt);
      }
      return response;
    })
    .catch(error => {
      if (opts.errorFilter(error, uri, requestOptions)) {
        if (attempt <= opts.attempts - 1) {
          return (new Promise(resolve => setTimeout(resolve, opts.transformDelay(attempt))))
          .then(() => rpWithRetry(uri, requestOptions, callback, attempt + 1));
        }
      }
      throw error;
    });
  }
  return rpWithRetry;
}

const retryCodes = [500, 502, 503];

me.defaultErrorFilter = function (error, uri, requestOptions) {
  return (error.message === 'Error: ETIMEDOUT')
    || (retryCodes.indexOf(error.statusCode) >= 0);
};

module.exports = me;
