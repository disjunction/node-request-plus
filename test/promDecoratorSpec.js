/* eslint-env jasmine */
'use strict';
const promDecorator = require('../src/promDecorator');
const requestPlus = require('../src/index');
const nock = require('nock');
const promClient = require('prom-client');

describe('promDecorator', () => {
  it('fails if no metric is provided', () => {
    expect(() => {
      requestPlus().plus.wrap(promDecorator);
    })
      .toThrow();
  });

  it('works with a counter (2 requests)', done => {
    const metric = new promClient.Counter('test_counter', 'help');

    const rp = requestPlus()
      .plus.wrap(promDecorator, {
        metric: metric
      });

    for (let i = 0; i++ < 2;) {
      nock('http://example.com')
        .get('/prom-decorator')
        .reply(200, 'ok');
    }

    rp('http://example.com/prom-decorator')
      .then(() => rp('http://example.com/prom-decorator'))
      .then(result => {
        expect(result).toBe('ok');
        expect(metric.get().values[0].value).toBe(2);
        done();
      })
      .catch(done.fail);
  });

  it('supports static labels', done => {
    const metric = new promClient.Counter(
      'test_counter',
      'help',
      ['label1', 'label2']
    );

    const rp = requestPlus()
      .plus.wrap(promDecorator, {
        metric: metric,
        labels: {
          label1: 'foo',
          label2: 'bar'
        }
      });

     nock('http://example.com')
      .get('/prom-decorator')
      .reply(200, 'ok');

    rp('http://example.com/prom-decorator')
      .then(() => {
        const labels = metric.get().values[0].labels;
        expect(labels.label1).toBe('foo');
        expect(labels.label2).toBe('bar');
        done();
      })
      .catch(done.fail);
  });


  it('support dynamic labels', done => {
    const metric = new promClient.Gauge('test_gauge', 'help', ['dynamic']);

    const rp = requestPlus()
      .plus.wrap(promDecorator, {
        metric: metric,
        labels: function() {
          return {
            dynamic: 'ok'
          };
        }
      });

     nock('http://example.com')
      .get('/prom-decorator')
      .reply(200, 'ok');

    rp('http://example.com/prom-decorator')
      .then(() => {
        const labels = metric.get().values[0].labels;
        expect(labels.dynamic).toBe('ok');
        done();
      })
      .catch(done.fail);
  });

  it('works with a histogram (2 requests)', done => {
    const metric = new promClient.Histogram(
      'test_histogram',
      'help',
      {buckets: [0.01, 1]}
    );

    const rp = requestPlus()
      .plus.wrap(promDecorator, {
        metric: metric
      });

    for (let i = 0; i++ < 2;) {
      nock('http://example.com')
        .get('/prom-decorator')
        .reply(200, 'ok');
    }

    rp('http://example.com/prom-decorator')
      .then(() => rp('http://example.com/prom-decorator'))
      .then(result => {
        expect(result).toBe('ok');
        // resulting values: 0.01, 1, +Inf, sum, count
        expect(metric.get().values.length).toBe(5);
        done();
      })
      .catch(done.fail);
  });
});
