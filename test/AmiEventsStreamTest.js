/**
 * Developer: BelirafoN
 * Date: 15.04.2016
 * Time: 15:39
 */

"use strict";

const assert = require('assert');
const fs = require('fs');
const AmiEventEmitter = require('../lib/AmiEventsStream');

describe('AmiEventsStream internal functionality', function() {
    this.timeout(process.env.MOCHA_TIMEOUT || 2000);

    let eventEmitter = null,
        readStream = null;

    beforeEach(() => {
        eventEmitter = new AmiEventEmitter();
        readStream = fs.createReadStream('./test/fixtures/ami.dump');
        readStream.on('error', error => console.log(error));
    });

    it('Push data to "data" handler', done => {
        let eventsCount = 0;
        eventEmitter.on('data', event => eventsCount++);
        readStream.on('end', () => {
            assert.equal(eventsCount, 6);
            done();
        });
        readStream.pipe(eventEmitter);
    });

    it('Push data to "amiEvent" handler', done => {
        let eventsCount = 0;
        eventEmitter.on('amiEvent', event => eventsCount++);
        readStream.on('end', () => {
            assert.equal(eventsCount, 5);
            done();
        });
        readStream.pipe(eventEmitter);
    });

    it('Push data to "amiResponse" handler', done => {
        let eventsCount = 0;
        eventEmitter.on('amiResponse', event => eventsCount++);
        readStream.on('end', () => {
            assert.equal(eventsCount, 1);
            done();
        });
        readStream.pipe(eventEmitter);
    });

    it('Emit events & apply parse-function', done => {
        let events = {};
        eventEmitter.on('amiEvent', event => {
            if(!events[event['Event']]){
                events[event['Event']] = [event];
            }else{
                events[event['Event']].push(event);
            }
        });
        readStream.on('end', () => {
            assert.equal(events['Hangup'].length, 3);
            assert.equal(events['HangupRequest'].length, 2);
            done();
        });
        readStream.pipe(eventEmitter);
    });

    it('Get last amiEvent with events', done => {
        let eventsCount = 0,
            expectedEvent = {
                Event: 'Hangup',
                Privilege: 'call,all',
                Channel: 'SIP/183-0001a215',
                Uniqueid: '1418896538.6181862',
                CallerIDNum: '183',
                CallerIDName: 'A -VIP',
                ConnectedLineNum: "11111111111",
                ConnectedLineName: 'V.I.P.-11111111111',
                AccountCode: "",
                Cause: '16',
                "Cause-txt": 'Normal Clearing'
            };

        eventEmitter.on('event', event => eventsCount++);
        readStream.on('end', () => {
            assert.deepEqual(eventEmitter.getLastEvent(), expectedEvent);
            assert.deepEqual(eventEmitter.lastEvent, expectedEvent);
            done();
        });
        readStream.pipe(eventEmitter);
    });

    it('Get last amiEvent without events', () => {
        assert.equal(eventEmitter.getLastEvent(), null);
        assert.equal(eventEmitter.lastEvent, null);
    });

    it('Get last amiResponse with responses', done => {
        let eventsCount = 0,
            expectedResponse = {
                Response: 'Pong'
            };

        eventEmitter.on('event', event => eventsCount++);
        readStream.on('end', () => {
            assert.deepEqual(eventEmitter.getLastResponse(), expectedResponse);
            assert.deepEqual(eventEmitter.lastResponse, expectedResponse);
            done();
        });
        readStream.pipe(eventEmitter);
    });

    it('Get last amiResponse without responses', () => {
        assert.equal(eventEmitter.getLastResponse(), null);
        assert.equal(eventEmitter.lastResponse, null);
    });

});