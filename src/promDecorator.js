'use strict';

/**
 * @param {Function} requester
 * @param {Object} opts
 * @param {Object} opts.metric - prom-client metric object
 * @param {Object|function(error, uri, requestOptions) : Object} [opts.labels={}] - prometheus labels
 * @param {number} [opts.value=1] - used for Counter.inc(.., value)
 */
module.exports = function(requester, opts) {
  if (!opts || !opts.metric) {
    throw new Error('promDecorator expects opts.metric object');
  }

  const metric = opts.metric;
  const type = metric.get().type;
  const isTimer = ['gauge', 'histogram', 'summary'].indexOf(type) >= 0;

  function getLabels(error, uri, requestOptions) {
    if (opts.labels) {
      if (opts.labels instanceof Function) {
        return opts.labels(error, uri, requestOptions, metric);
      } else {
        return opts.labels;
      }
    }
  }

  function me(uri, requestOptions, callback) {
    let timer;
    let labels;
    if (isTimer) {
      labels = {};
      timer = metric.startTimer(labels);
    }

    function measure(error) {
      const currentLabels = getLabels(error, uri, requestOptions);
      if (type === 'counter') {
        metric.inc(currentLabels, opts.value || 1);
      } else if (isTimer) {
        Object.assign(labels, currentLabels);
        timer();
      }
    }

    return requester(uri, requestOptions, callback)
    .then(body => {
      measure();
      return body;
    })
    .catch(error => {
      measure(error);
      throw error;
    });
  }

  return me;
};
