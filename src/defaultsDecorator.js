'use strict';

// mergeDeep taken from http://stackoverflow.com/a/37164538/167219
// to avoid extra dependency
// difference: it has no validation if inputs are objects (because they are)

function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item) && item !== null);
}

function mergeDeep(target, source) {
  const output = Object.assign({}, target);
  Object.keys(source).forEach(key => {
    if (isObject(source[key])) {
      if (!(key in target)) {
        Object.assign(output, {[key]: source[key]});
      } else {
        output[key] = mergeDeep(target[key], source[key]);
      }
    } else {
      Object.assign(output, {[key]: source[key]});
    }
  });
  return output;
}

/**
 * @param {Function} requester
 * @param {Object} [opts]
 * @param {EventEmitter} [opts.emitter]
 */
module.exports = function(requester, defaults) {
  if (typeof defaults !== 'object') {
    throw new Error('defaults object expected, type ' + typeof defaults + ' provided');
  }
  return function me(uri, requestOptions, callback) {
    if (typeof requestOptions === 'object') {
      requestOptions = mergeDeep(defaults, requestOptions);
    } else {
      if (typeof uri === 'string') {
        uri = {uri};
      }
      uri = mergeDeep(defaults, uri);
    }
    return requester(uri, requestOptions, callback);
  };
};
