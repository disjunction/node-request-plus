'use strict';

const urlLib= require('url');
const myName = 'cacheDecorator';

/**
 * hashes (compresses) a full stringified request params into a short "unqiue" key
 * implemetation taken from:
 * http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method
 *
 * @param {string} str - arbitrary string (can be very long)
 * @param {Function} requester - passed through just in case we want to access .plus object
 * @return string - should be short enough to be used as a part of a key
 */
const defaultHash = function (str, requester) { // eslint-disable-line
  let hash = 0, char;
  for (let i = 0; i < str.length; i++) {
    char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return '_' + hash;
};

/**
 * @param {string|Object} requestParam - the first param for request
 * @param {function(str, requester) : string} hash - string hashing function
 * @param {Function} requester - passed through just in case we want to access .plus object
 * @return string
 */
const defaultGetKey = function(requestParam, hash, requester) {
  if (typeof requestParam === 'object') {
    const hashString = hash(JSON.stringify(requestParam), requester);
    let uri = requestParam.uri || requestParam.url;

    // uri|url can be a url for url.parse()
    if (typeof uri === 'object') {
      uri = urlLib.format(uri);
    } else if (requestParam.baseUrl) {
      uri = urlLib.resolve(requestParam.baseUrl, uri);
    }

    if (uri) {
      return uri + ' ' + hashString;
    }

    // we should normally never come here,
    // but we still try to cache even if we failed to recognize URI
    return hashString;
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
    emit('cacheRequest', uri, key);
    return opts.cache.wrap(
      key,
      () => {
        emit('cacheMiss', uri, key);
        return requester(uri, requestOptions, callback);
      },
      opts.cacheOptions || {}
    );
  };
};
