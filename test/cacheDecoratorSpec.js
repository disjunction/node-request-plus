/* eslint-env jasmine */
'use strict';

const rp = require('request-promise-any');
const cacheWrapper = require('../src/cacheDecorator');
const nock = require('nock');
const cm = require('cache-manager');

describe('cacheDecorator', () => {
  let cache;

  beforeEach(() => {
    cache = cm.caching({store: 'memory'});
  });

  it('throws if no cache provided', () => {
    expect(() => cacheWrapper(rp, {foo: 'bar'})).toThrow();
  });

  it('first makes request, then uses a cached value', done => {
    nock('http://example.com')
      .get('/test-path')
      .reply(200, 'hello foo');

    const request = cacheWrapper(rp, {cache: cache});

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

  it('works with object request param and pool is ignored', done => {
    nock('http://example.com')
      .get('/json/api')
      .reply(200, '{"a": 123}', {
        'Content-Type': 'application/json'
      });

    const request = cacheWrapper(rp, {cache: cache});

    request({
      uri: 'http://example.com/json/api',
      pool: {whatever: 123},
      json: true
    })
      .then(body => {
        expect(body.a).toBe(123);
        return request({
          uri: 'http://example.com/json/api',
          json: true
        });
      })
      .then(body => {
        expect(body.a).toBe(123);
        done();
      })
      .catch(done.fail);
  });

  it('works with uri being urlObject', done => {
    nock('http://example.com')
      .get('/some/other')
      .reply(200, 'the information');

    const request = cacheWrapper(rp, {cache: cache});
    const req = {
      url: {
        protocol: 'http:',
        slashes: true,
        auth: null,
        host: 'example.com',
        port: 80,
        hostname: 'example.com',
        hash: null,
        search: null,
        query: null,
        pathname: '/some/other',
        path: '/some/other',
        href: 'http://example.com/some/other'
      }
    };

    request(req)
      .then(body => {
        expect(body).toBe('the information');
        return request(req);
      })
      .then(body => {
        expect(body).toBe('the information');
        done();
      })
      .catch(done.fail);
  });

  it('does not cache errors', done => {
    nock('http://example.com')
      .get('/some/address')
      .reply(500, 'there was an error');

    const request = cacheWrapper(rp, {cache: cache});

    request({
      baseUrl: 'http://example.com',
      uri: '/some/address'
    })
      .then(() => done.fail('unexpected success'))
      .catch(reason => {
        expect(reason.error).toBe('there was an error');
        return request({
          baseUrl: 'http://example.com',
          uri: '/some/address'
        });
      })
      .catch(reason => {
        expect(reason.error.message).toContain('Nock');
        done();
      });
  });

  it('also supports strange requests with no uri and alike', done => {
    function successWrapper() {
      return () => {
        return Promise.resolve('everything is fine');
      };
    }

    const request = cacheWrapper(successWrapper, {
      cache: cache
    });

    request({
      veryStrangeRequest: 'aliens://example.com',
    })
      .then(() => {
        done();
      })
      .catch(done.fail);
  });
});
