/* eslint-env jasmine */
'use strict';

const retryWrapper = require('../src/retryDecorator');
const rp = require('../src/index');
const nock = require('nock');
const expect = require('chai').expect;

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
        expect(body).to.equal('hello foo');
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
});

