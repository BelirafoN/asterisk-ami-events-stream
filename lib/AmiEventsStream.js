/**
 * Developer: Alex Voronyansky <belirafon@gmail.com>
 * Date: 14.11.2014
 * Time: 12:28
 */

"use strict";

let Transform = require('stream').Transform;

/**
 * Ami Event Emitter
 */
class AmiEventsStream extends Transform{

    /**
     *
     * @param eventFormatter
     */
    constructor(eventFormatter){
        super();
        Object.assign(this, {
            _parser: eventFormatter,
            _rawData: [],
            _sawFirstCrLf: false,
            _lastAmiEvent: null
        });
    }

    /**
     *
     * @param chunk
     * @param encoding
     * @param done
     * @private
     */
    _transform(chunk, encoding, done){
        let chunkLength = chunk.length,
            split = -1,
            offset = 0;

        for (let i = offset; i < chunkLength; i++) {
            if (chunk[i] === 13 && i + 1 < chunkLength && chunk[i + 1] === 10){
                i++;

                if (this._sawFirstCrLf){
                    split = i;
                    this._rawData.push(chunk.slice(offset, split));
                    this._lastAmiEvent = Buffer.concat(this._rawData);

                    if(this._parser && this._parser instanceof Function){
                        this.emit('amiEvent', this._parser(this._lastAmiEvent));

                    }else{
                        this.emit('amiEvent', this._lastAmiEvent);
                    }

                    this.push(this._lastAmiEvent);
                    this._rawData = [];
                    this._sawFirstCrLf = false;
                    offset = split;

                }else{
                    this._sawFirstCrLf = true;
                }

            }else{
                this._sawFirstCrLf = false;
            }
        }

        if(split + 1 < chunkLength){
            this._rawData.push(chunk.slice(split === -1 ? 0 : split));
        }
        done();
    }

    /**
     *
     * @returns {*}
     */
    getLastEvent(){
        if(!this._lastAmiEvent){ return null; }
        let lastEventStr = this._lastAmiEvent.toString('utf-8').replace(/^[\r\n]+|[\r\n]+$/g, '');
        if(this._parser && this._parser instanceof Function){
            return this._parser(lastEventStr);
        }
        return lastEventStr;
    }
}

module.exports = AmiEventsStream;