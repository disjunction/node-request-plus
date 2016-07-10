/* eslint-env mocha */
"use strict";

let requestCached = require("../src/index"),
    nock = require("nock"),
    expect = require("chai").expect,
    cm = require("cache-manager"),
    mongoose,
    cmm;

function defineTest() {
    describe("request-cached-promise with mongoose", () => {
        it ("works", function(done) {
            this.timeout(1000);

            nock("http://some.service")
                .defaultReplyHeaders({
                    "Content-Type": "application/json"
                })
                .replyContentLength()
                .get("/providing/user/john.doe")
                .reply(200, {firstName: "John"});

            let cache = cm.caching({
                store: cmm,
                mongoose: mongoose,
                modelOptions: {
                    collection: "cacheman_rcp"
                }
            });

            mongoose.connect("mongodb://127.0.0.1/test");

            let request = requestCached.bindToCache(cache);

            Promise.resolve()
                .then(cache.reset.bind(cache))
                .then(() => {
                    return request({
                        uri: "http://some.service/providing/user/john.doe",
                        json: true
                    });
                })
                .then(body => {
                    expect(body.firstName).to.equal("John");
                    // this request would not succeed without caching, because nock works only once
                    return request({
                        uri: "http://some.service/providing/user/john.doe",
                        json: true
                    });
                })
                .then(body => {
                    expect(body.firstName).to.equal("John");
                    done();
                })
                .catch(done);
        });
    });
}

try {
    cmm = require("cache-manager-mongoose");
    mongoose = require("mongoose");
    defineTest();
} catch (e) {
    describe("request-cached-promise with mongoose SKIPPED", () => {
        it ("npm i mongoose cache-manager-mongoose - do it manully to run this test");
    });
}