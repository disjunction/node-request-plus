/* eslint-env jasmine */
'use strict';

const retryWrapper = require('../src/retryDecorator');
const rp = require('../src/index');
const nock = require('nock');

describe('retryDecorator', () => {
  it('retries on 503 error', done => {
    nock('http://example1.com')
      .get('/test-path')
      .reply(503, 'unavailable');

    nock('http://example1.com')
      .get('/test-path')
      .reply(503, 'unavailable');

    nock('http://example1.com')
      .get('/test-path')
      .reply(200, 'hello foo');

    const request = rp().plus.wrap(retryWrapper, {
      delay: 100
    });

    request('http://example1.com/test-path')
      .then(body => {
        expect(body).toEqual('hello foo');
        done();
      })
      .catch(done.fail);
  });

  it('fails if max retry reached', done => {
    nock('http://example2.com')
      .get('/test-path')
      .reply(503, 'unavailable');

    nock('http://example2.com')
      .get('/test-path')
      .reply(503, 'unavailable');

    nock('http://example2.com')
      .get('/test-path')
      .reply(200, 'hello foo');

    const request = rp().plus.wrap(retryWrapper, {
      delay: 100,
      attempts: 2
    });
    request('http://example2.com/test-path')
      .then(() => {
        done.fail('unexpected success');
      })
      .catch(done);
  });

  it('fails for statusCode=404 without retry', done => {
    nock('http://example3.com')
      .get('/test-path')
      .reply(403, 'not found');

    nock('http://example3.com')
      .get('/test-path')
      .reply(200, 'hello foo');

    const request = rp().plus.wrap(retryWrapper, {
      delay: 100
    });
    request('http://example.com/test-path')
      .then(() => {
        done.fail('unexpected success');
      })
      .catch(done);
  });

  it('uses delay and errorFilter closuers', done => {
    nock('http://example4.com')
      .get('/test-path')
      .reply(403, 'not found');

    nock('http://example4.com')
      .get('/test-path')
      .reply(200, 'hello foo');

    const request = rp().plus.wrap(retryWrapper, {
      delay: function(attempt) {
        return attempt * 10 + 10;
      },
      errorFilter(error) {
        return error.statusCode >= 400;
      }
    });
    request('http://example4.com/test-path')
      .then(done)
      .catch(done.fail);
  });
});

