/* eslint-env jasmine */
'use strict';
const decorator = require('../src/defaultsDecorator');

describe('defaultsDecorator', () => {
  it('throws on bad defaults', () => {
    expect(() => decorator(() => {}, 'bad')).toThrow();
  });

  it('merges properties on top level', done => {
    function stub(uri) {
      expect(uri.uri).toBe('/test');
      expect(uri.some).toBe('12345');
      done();
    }
    const decorated = decorator(stub, {some: '12345'});
    decorated({uri: '/test'});
  });

  it('merges properties if uri is a string', done => {
    function stub(uri) {
      expect(uri.uri).toBe('/test');
      expect(uri.some).toBe('12345');
      done();
    }
    const decorated = decorator(stub, {some: '12345'});
    decorated('/test');
  });

  it('uri and uriOptions have priority over defaults', done => {
    function stub(uri) {
      expect(uri.uri).toBe('/test');
      expect(uri.json).toBe(true);
      done();
    }
    const decorated = decorator(stub, {uri: '12345', json: true});
    decorated({uri: '/test'});
  });

  it('merges properties if uri is a string but uriOptions is provided', done => {
    function stub(uri, uriOptions) {
      expect(uri).toBe('/test');
      expect(uriOptions.headers['X-Something']).toBe('ok');
      expect(uriOptions.headers['X-Other']).toBe('also good');
      expect(uriOptions.qs.session).toBe('important');
      expect(uriOptions.json).toBe(true);
      done();
    }
    const decorated = decorator(stub, {
      headers: {
        'X-Other': 'also good'
      },
      json: true
    });
    decorated('/test', {
      headers: {
        'X-Something': 'ok'
      },
      qs: {
        session: 'important'
      }
    });
  });
});
