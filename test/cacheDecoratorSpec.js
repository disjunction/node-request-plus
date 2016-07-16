/* eslint-env jasmine */
'use strict';

const rp = require('request-promise-native');
const cacheWrapper = require('../src/cacheDecorator');
const nock = require('nock');
const cm = require('cache-manager');

describe('cacheDecorator', () => {
  let cache;

  beforeEach(() => {
    cache = cm.caching({store: 'memory'});
  });

  it('first makes request, then uses a cached value', done => {
    nock('http://example.com')
      .get('/test-path')
      .reply(200, 'hello foo');

    const request = cacheWrapper(rp, {
      cache: cache
    });
    request('http://example.com/test-path')
      .then(body => {
        expect(body).toEqual('hello foo');
        return request('http://example.com/test-path');
      })
      .then(body => {
        // this request would not succeed without caching, because nock works only once
        expect(body).toEqual('hello foo');
        done();
      })
      .catch(done.fail);
  });
});

