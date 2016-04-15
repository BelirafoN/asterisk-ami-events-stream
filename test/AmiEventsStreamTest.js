/**
 * Developer: BelirafoN
 * Date: 15.04.2016
 * Time: 15:39
 */

"use strict";

const CRLF = '\r\n',
    assert = require('assert'),
    path = require('path'),
    fs = require('fs'),
    AmiEventEmitter = require('../lib/AmiEventsStream');

describe('AmiEventsStream internal functionality', () => {
    let eventEmitter = null,
        readStream = null;

    beforeEach(() => {
        eventEmitter = new AmiEventEmitter(event => {
            return event
                .toString('utf-8')
                .replace(/^[\r\n]+|[\r\n]+$/g, '')
                .split(CRLF)
                .reduce((obj, curr) => {
                    let pair = curr.split(/:\s|:$/);
                    obj[pair[0]] = pair.length > 1 ? pair[1] : null;
                    return obj;
                }, {})
        });
        readStream = fs.createReadStream(path.join(__dirname, './fixtures/ami.dump'));
    });

    it('Push data to "data" handler', done => {
        let eventsCount = 0;
        eventEmitter.on('data', event => eventsCount++);
        readStream.on('end', () => {
            assert.equal(eventsCount, 5);
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

    it('Get last amiEvent', done => {
        let eventsCount = 0;
        eventEmitter.on('event', event => eventsCount++);
        readStream.on('end', () => {
            assert.deepEqual(eventEmitter.getLastEvent(), {
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
            });
            done();
        });
        readStream.pipe(eventEmitter);
    });

    it('Get last amiEvent without events', () => {
        assert.equal(eventEmitter.getLastEvent(), null);
    });

});