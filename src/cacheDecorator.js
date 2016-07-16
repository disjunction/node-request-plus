'use strict';

const myName = 'cacheDecorator';

// http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method
const defaultHash = function (str, requester) { // eslint-disable-line
  let hash = 0, char;
  if (!str.length) {
    return hash;
  }
  for (let i = 0; i < str.length; i++) {
    char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return '_' + hash;
};

const defaultGetKey = function(requestParam, hash, requester) {
  if (typeof requestParam === 'object') {
    if (requestParam.uri) {
      return requestParam.uri + ' ' + request.hash(JSON.stringify(requestParam));
    }
    return hash(JSON.stringify(requestParam), requester);
  } else {
    return requestParam;
  }
};

/**
* @param {Function} requester
* @param {Object} opts
* @param {Object} opts.cache - cache manager cache
* @param {Object} [opts.cacheOptions] - otions for the cache
* @param {function(requestParam, hash, requester): string} [opts.getKey] - generates a string key
* @param {function(str, requester): string} [opts.hash] - hashes (compresses) a stringified key
* @return {function(uri, requestOptions, callback): Promise}
*/
module.exports = function(requester, opts) {
  const emit = requester.plus && requester.plus.emitter
    ? requester.plus.emitter.emit.bind(requester.plus.emitter)
    : () => {};

  if (typeof opts !== 'object' || !opts.cache) {
    throw new Error(myName + ' expects {cache: <Cache>} as opts');
  }
  const getKey = opts.getKey || defaultGetKey;
  const hash = opts.hash || defaultHash;

  return function(uri, requestOptions, callback) {
    let key = getKey(uri, hash, requester);
    emit('cacheRequest', uri, requestOptions);
    return opts.cache.wrap(
      key,
      () => {
        emit('cacheMiss', uri, requestOptions);
        return requester(uri, requestOptions, callback);
      },
      opts.cacheOptions || {}
    );
  };
};
