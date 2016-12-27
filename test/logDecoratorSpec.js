/* eslint-env jasmine */
'use strict';

const rewire = require('rewire');
const eventDecorator = require('../src/eventDecorator');
const logDecorator = rewire('../src/logDecorator');
const rpPlus = require('../src/index');
const nock = require('nock');

describe('logDecorator', () => {
  it('calls info for request', done => {
    const rp = rpPlus()
      .plus.wrap(eventDecorator)
      .plus.wrap(logDecorator, {
        loggers: {
          info: done,
          error: done.fail
        }
      });

    nock('http://index-log0.com')
      .get('/test-path')
      .reply(200, 'test phrase');

    rp('http://index-log0.com/test-path')
      .catch(done.fail);
  });

  it('calls error for failed request', done => {
    const rp = rpPlus()
      .plus.wrap(eventDecorator)
      .plus.wrap(logDecorator, {
        loggers: {
          info: () => {},
          error: done
        }
      });

    nock('http://index-log1.com')
      .get('/test-path')
      .reply(500, 'failed');

    rp('http://index-log1.com/test-path')
      .then(() => done.fail('unexpected success'))
      .catch(() => {});
  });

  it('calls error callback for failed request', done => {
    const rp = rpPlus()
      .plus.wrap(eventDecorator)
      .plus.wrap(logDecorator, {
        events: {
          fail: function(eventName, uri, error) {
            expect(eventName).toBe('fail');
            expect(uri).toBe('http://index-log2.com/test-path');
            expect(error.response.statusCode).toBe(500);
            done();
          }
        }
      });

    nock('http://index-log2.com')
      .get('/test-path')
      .reply(500, 'failed');

    rp('http://index-log2.com/test-path')
      .then(() => done.fail('unexpected success'))
      .catch(() => {});
  });

  it('uses std. console', done => {
    logDecorator.__set__({
      console: {
        info: () => {},
        error: done
      }
    });

    const rp = rpPlus()
      .plus.wrap(eventDecorator)
      .plus.wrap(logDecorator);

    nock('http://index-log2.com')
      .get('/test-path')
      .reply(500, 'failed');

    rp('http://index-log2.com/test-path')
      .then(() => done.fail('unexpected success'))
      .catch(() => {});
  });

  it('warn also works', done => {
    logDecorator.__set__({
      console: {
        info: () => {},
        warn: done
      }
    });

    const rp = rpPlus()
      .plus.wrap(eventDecorator)
      .plus.wrap(logDecorator, {
        events: {
          fail: 'warn'
        }
      });

    nock('http://index-log2.com')
      .get('/test-path')
      .reply(500, 'failed');

    rp('http://index-log2.com/test-path')
      .then(() => done.fail('unexpected success'))
      .catch(() => {});
  });

  it('throws without emitter', () => {
    expect(() => {
      rpPlus().plus.wrap(logDecorator);
    }).toThrow();
  });

  it('throws when loggers and actions do not match', () => {
    expect(() => {
      rpPlus()
        .plus.wrap(eventDecorator)
        .plus.wrap(logDecorator, {
          loggers: {
            some: 'whatever'
          }
        });
    }).toThrow();
  });

});
