const requestPromise = require('request-promise');

const wrappers = {
  event: require('./eventDecorator'),
  retry: require('./retryDecorator'),
  cache: require('./cacheDecorator'),
};

function me(factoryOpts) {
  function replaced(uri, requestOptions, callback) {
    return requestPromise(uri, requestOptions, callback);
  }

  const wrap = ((decorator, opts) => {
    const newReplaced = decorator(replaced, opts);
    newReplaced.plus = Object.assign({}, replaced.plus, {wrap: wrap});
    replaced = newReplaced;
    return replaced;
  });

  replaced.plus = {
    wrap: wrap
  };

  if (factoryOpts) {
    for (let wrapperName of ['event', 'retry', 'cache']) {
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

module.exports = me;
