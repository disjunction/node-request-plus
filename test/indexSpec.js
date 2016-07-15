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
});
