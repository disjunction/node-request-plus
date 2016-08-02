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
  if (!metric.get) {
    throw new Error('unexpected object passed as prom metric.'
        + ' It should have method get()');
  }
  const type = metric.get().type;
  const isTimer = ['gauge', 'histogram', 'summary'].indexOf(type) >= 0;
  if (!isTimer && type !== 'counter') {
    throw new Error('unexpected metric type: ' + type);
  }

  function getLabels(error, uri, requestOptions) {
    let labels;
    if (opts.labels) {
      if (opts.labels instanceof Function) {
        labels = opts.labels(error, uri, requestOptions, metric);
      } else {
        labels = opts.labels;
      }
    } else {
      labels = {};
    }
    if (metric.labelNames.indexOf('status_code') >= 0)  {
      let statusCode;
      if (error) {
        if (error.response) {
          statusCode = error.response.statusCode;
        } else if (error.error && error.error.code) {
          statusCode = error.error.code;
        } else {
          statusCode = 'UNKNOWN';
        }
      } else {
        statusCode = 200;
      }
      labels['status_code'] = statusCode;
    }
    return labels;
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
      } else { // this can only be a timer
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
