/* eslint-env jasmine */
'use strict';
const eventDecorator = require('../src/eventDecorator');
const retryDecorator = require('../src/retryDecorator');
const rpPlus = require('../src/index');
const nock = require('nock');

describe('multiple wraps', () => {
  it('inflate plus propertis', done => {
    function dummyWrapper(requester) {
      requester.plus.dummy = 'hello';
      return (uri, requestOptions, callback) => {
        return requester(uri, requestOptions, callback);
      };
    }

    const rp = rpPlus()
      .plus.wrap(eventDecorator)
      .plus.wrap(retryDecorator, {delay: 100})
      .plus.wrap(dummyWrapper);

    expect(rp.plus.emitter).toBeDefined();
    expect(rp.plus.dummy).toBe('hello');

    nock('http://index-muliple0.com')
      .get('/test-path')
      .reply(500, 'oops');

    nock('http://index-muliple0.com')
      .get('/test-path')
      .reply(200, 'test phrase');

    rp.plus.emitter.on('retryResponse', done);

    rp('http://index-muliple0.com/test-path')
      .catch(done.fail);
  });

  it('can be defined in factory options', done => {
    const rp = rpPlus({
      event: true,
      retry: {delay: 50}
    });

    expect(rp.plus.emitter).toBeDefined();

    nock('http://index-muliple1.com')
      .get('/test-path')
      .reply(500, 'oops');

    nock('http://index-muliple1.com')
      .get('/test-path')
      .reply(200, 'test phrase');

    rp.plus.emitter.on('retryResponse', done);

    rp('http://index-muliple1.com/test-path')
      .catch(done.fail);
  });

  it('retry emits multiple retryRequest and one retryResponse', done => {
    for (let i = 0; i++ < 9;) {
      nock('http://index-muliple2.com')
        .get('/test-path')
        .reply(500, 'error');
    }

    nock('http://index-muliple2.com')
      .get('/test-path')
      .reply(200, 'success');

    const request = rpPlus()
      .plus.wrap(eventDecorator)
      .plus.wrap(retryDecorator, {
        delay: 20,
        attempts: 10
      });

    let counter = 0;
    request.plus.emitter.on('retryRequest', () => counter++);
    request.plus.emitter.on('retryResponse', () => {
      expect(counter).toBe(10);
      done();
    });

    request('http://index-muliple2.com/test-path')
      .catch(done.fail);
  });

});
