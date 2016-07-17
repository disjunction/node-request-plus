'use strict';
const requestPromise = require('request-promise-native');
const wrappers = {
  event: require('./eventDecorator'),
  retry: require('./retryDecorator'),
  cache: require('./cacheDecorator'),
  prom: require('./promDecorator'),
};

/**
 * @param {Object} [factoryOptions]
 * @param {Object} [factoryOptions.event]
 * @param {Object} [factoryOptions.retry]
 * @param {Object} [factoryOptions.cache]
 * @param {Object} [factoryOptions.prom]
 * @param {Function} [factoryOptions.requestPromise] - alternative request-promise implementation
 * @return {Function} - same API as request, but with .plus object set
 */
function me(factoryOpts) {
  const requester = factoryOpts && factoryOpts.requestPromise || requestPromise;

  function replaced(uri, requestOptions, callback) {
    return requester(uri, requestOptions, callback);
  }

  const wrap = ((decorator, opts) => {
    if (typeof decorator === 'string') {
      if (!wrappers[decorator]) {
        throw new Error('unknown request-plus wrapper: ' + decorator);
      }
      decorator = wrappers[decorator];
    }
    const newReplaced = decorator(replaced, opts);
    newReplaced.plus = Object.assign({}, replaced.plus, {wrap: wrap});
    replaced = newReplaced;
    return replaced;
  });

  replaced.plus = {
    wrap: wrap
  };

  if (factoryOpts) {
    for (let wrapperName of Object.keys(wrappers)) {
      if (factoryOpts[wrapperName]) {
        replaced = replaced.plus.wrap(wrappers[wrapperName], factoryOpts[wrapperName]);
      }
    }
    return replaced;
  }

  return replaced;
};

me.registerWrapper = function(wrapperName, wrapper) {
  wrappers[wrapperName] = wrapper;
};

me.unregisterWrapper = function(wrapperName) {
  delete wrappers[wrapperName];
};

module.exports = me;
