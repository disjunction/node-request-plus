/* eslint-env mocha */
"use strict";

let requestCached = require("../src/index"),
    nock = require("nock"),
    expect = require("chai").expect,
    cm = require("cache-manager"),
    cmm;

function defineTest() {
    describe("request-cached-promise with mongo cache", () => {
        it ("works", function(done) {
            this.timeout(20000);
            nock("http://example.com")
                .get("/test-path")
                .reply(200, "hello foo");
            let cache = cm.caching({
                store: cmm,
                uri: "mongodb://127.0.0.1/test",
                options: {
                    collection: "my_test",
                    ttl: 60000
                }
            });

            let request = requestCached.bindToCache(cache);
            Promise.resolve()
                .then(() => {
                    // give it some time to connect (lol)
                    return new Promise(resolve => setTimeout(resolve, 1000));
                })
                .then(() => {
                    return request("http://example.com/test-path");
                })
                .then(body => {
                    expect(body).to.equal("hello foo");
                    // this request would not succeed without caching, because nock works only once
                    return request("http://example.com/test-path");
                })
                .then(body => {
                    expect(body).to.equal("hello foo");
                    done();
                })
                .catch(done);

        });
    });
}

try {
    cmm = require("cache-manager-mongodb");
    defineTest();
} catch (e) {
    describe("request-cached-promise with mongo SKIPPED", () => {
        it ("npm i cache-manager-mongodb - do it manully to run this test");
    });
}