/* eslint-env jasmine */
'use strict';
const requester = require('../src/index');
const decorator = require('../src/eventDecorator');
const nock = require('nock');

describe('eventDecorator', () => {
  it('emits request event', done => {
    const rp = requester().plus.wrap(decorator);
    nock('http://index1.com')
      .get('/test-path')
      .reply(200, 'hello foo');

    rp.plus.emitter.on('request', done);

    rp('http://index1.com/test-path')
      .catch(done.fail);
  });

  it('emits response event', done => {
    const rp = requester().plus.wrap(decorator);
    nock('http://index2.com')
      .get('/test-path')
      .reply(200, 'hello foo');

    rp.plus.emitter.on('response', body => {
      expect(body).toEqual('hello foo');
      done();
    });

    rp.plus.emitter.on('error', done.fail);

    rp('http://index2.com/test-path')
      .catch(done.fail);
  });

  it('emits error event', done => {
    const rp = requester().plus.wrap(decorator);
    nock('http://index3.com')
      .get('/test-path')
      .reply(500, 'hello foo');

    rp.plus.emitter.on('error', error => {
      expect(error.statusCode).toBe(500);
      done();
    });

    rp('http://index3.com/test-path')
      .then(() => done.fail('unexpectedly reached .then'))
      .catch(() => {}); // make bluebird happy ;)
  });
});
