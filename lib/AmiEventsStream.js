/**
 * Developer: Alex Voronyansky <belirafon@gmail.com>
 * Date: 14.11.2014
 * Time: 12:28
 */

"use strict";

const Transform = require('stream').Transform;
const eventUtils = require('asterisk-ami-event-utils');

/**
 * Ami Event Emitter
 */
class AmiEventsStream extends Transform{

    /**
     *
     */
    constructor(){
        super();
        Object.assign(this, {
            _parser: eventUtils.toObject,
            _rawData: [],
            _sawFirstCrLf: false,
            _buffer: null,
            _lastAmiEvent: null,
            _lastAmiResponse: null,
            _isEmitted: true
        });
    }

    /**
     *
     * @returns {*}
     */
    getLastEvent(){
        return this._lastAmiEvent;
    }

    /**
     *
     * @returns {*}
     */
    get lastEvent(){
        return this.getLastEvent();
    }

    /**
     *
     * @returns {null}
     */
    getLastResponse(){
        return this._lastAmiResponse;
    }

    /**
     *
     * @returns {null}
     */
    get lastResponse(){
        return this.getLastResponse();
    }

    /**
     *
     * @param chunk
     * @param encoding
     * @param done
     * @private
     */
    _transform(chunk, encoding, done){
        if(this._isEmitted && /^Response:\sFollow/i.test(eventUtils.toString(chunk))){
            this._chunkAnalyzeExtended(chunk);
        }else{
            this._chunkAnalyze(chunk);
        }
        done();
    }

    /**
     *
     * @param chunk
     * @private
     */
    _chunkAnalyze(chunk){
        let chunkLength = chunk.length,
            split = -1,
            offset = 0;

        for (let i = offset; i < chunkLength; i++) {
            if (chunk[i] === 13 && i + 1 < chunkLength && chunk[i + 1] === 10){
                i++;

                if (this._sawFirstCrLf){
                    split = i;
                    this._rawData.push(chunk.slice(offset, split));
                    this._buffer = Buffer.concat(this._rawData);
                    this._emission(this._buffer).push(this._buffer);
                    this._rawData = [];
                    this._sawFirstCrLf = false;
                    offset = split;

                }else{
                    this._sawFirstCrLf = true;
                    this._isEmitted = false;
                }

            }else{
                this._sawFirstCrLf = false;
                this._isEmitted = false;
            }
        }

        if(split + 1 < chunkLength){
            this._rawData.push(chunk.slice(split === -1 ? 0 : split));
        }
    }

    /**
     *
     * @param chunk
     * @private
     */
    _chunkAnalyzeExtended(chunk){

        //todo: implement method

        console.log(eventUtils.toString(chunk));
    }

    /**
     *
     * @param eventBuffer
     * @private
     */
    _emission(eventBuffer){
        let eventStr = eventUtils.toString(eventBuffer);

        if(/^Event/i.test(eventStr)){
            this._lastAmiEvent = this._parser(eventBuffer);
            this.emit('amiEvent', this._lastAmiEvent);

        }else if(/^Response/i.test(eventStr)){
            this._lastAmiResponse = this._parser(eventBuffer);
            this.emit('amiResponse', this._lastAmiResponse);
        }

        this._isEmitted = true;
        return this;
    }
}

module.exports = AmiEventsStream;