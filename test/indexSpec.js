/* eslint-env jasmine */
'use strict';
const requestPromise = require('request-promise');
const rpPlus = require('../src/index');
const nock = require('nock');

describe('index', () => {
  it('does not break basic functionility', done => {
    const rp = rpPlus(requestPromise);
    nock('http://index0.com')
      .get('/test-path')
      .reply(200, 'hello foo');

    rp('http://index0.com/test-path')
      .then(body => {
        expect(body).toEqual('hello foo');
        done();
      })
      .catch(done.fail);
  });
  it('emits request event', done => {
    const rp = rpPlus(requestPromise);
    nock('http://index1.com')
      .get('/test-path')
      .reply(200, 'hello foo');

    rp.emitter.on('request', done);

    rp('http://index1.com/test-path')
      .catch(done.fail);
  });

  it('emits response event', done => {
    const rp = rpPlus(requestPromise);
    nock('http://index2.com')
      .get('/test-path')
      .reply(200, 'hello foo');

    rp.emitter.on('response', body => {
      expect(body).toEqual('hello foo');
      done();
    });

    rp.emitter.on('error', done.fail);

    rp('http://index2.com/test-path')
      .catch(done.fail);
  });

  it('emits error event', done => {
    const rp = rpPlus(requestPromise);
    nock('http://index3.com')
      .get('/test-path')
      .reply(500, 'hello foo');

    rp.emitter.on('error', error => {
      expect(error.statusCode).toBe(500);
      done();
    });

    rp.emitter.on('response', done.fail);

    rp('http://index3.com/test-path')
      .then(done.fail);
  });
});
