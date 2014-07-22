/***@@@ BEGIN LICENSE @@@***/
/*───────────────────────────────────────────────────────────────────────────*\
│  Copyright (C) 2013 eBay Software Foundation                                │
│                                                                             │
│hh ,'""`.                                                                    │
│  / _  _ \  Licensed under the Apache License, Version 2.0 (the "License");  │
│  |(@)(@)|  you may not use this file except in compliance with the License. │
│  )  __  (  You may obtain a copy of the License at                          │
│ /,'))((`.\                                                                  │
│(( ((  )) ))    http://www.apache.org/licenses/LICENSE-2.0                   │
│ `\ `)(' /'                                                                  │
│                                                                             │
│   Unless required by applicable law or agreed to in writing, software       │
│   distributed under the License is distributed on an "AS IS" BASIS,         │
│   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  │
│   See the License for the specific language governing permissions and       │
│   limitations under the License.                                            │
\*───────────────────────────────────────────────────────────────────────────*/
/***@@@ END LICENSE @@@***/

'use strict';

var os = require('os'),
	util = require('util'),
	stream = require('stream'),
	AbstractWriter = require('../abstractWriter'),
    Meta = require('./meta'),
    KeyHelper = require('./key_helper');

function PropertyWriter() {
    PropertyWriter.super_.call(this);
}

util.inherits(PropertyWriter, AbstractWriter);

PropertyWriter.prototype._doCreateReadStream = function(data) {
    return new ReadStream(data);
};


function ReadStream(data) {
    ReadStream.super_.call(this);
	this._data = data;
}

util.inherits(ReadStream, stream.Readable);

ReadStream.prototype._read = function (size) {
    this._process(null, this._data);
    this.push(null);
};

/* TODO:  Make more efficient */
function clone(a) {
   return JSON.parse(JSON.stringify(a));
}

ReadStream.prototype._process = function (namespace, data) {

    // TODO: Some more work in this direction to make it
    // super fast, if necessary.
    try {
        var temp = clone( data['data'] );
        data['data'] = temp;
    } catch( e ){
        console.warn( e );
    }

    var parent = this;

    /* Try to fit to preexisting meta data to avoid loss: */
    var newLine = '\n';
    var keysAdded = {};
    if ( typeof data === 'object' ) {
        var meta = data['__meta__'];
        if ( meta ) {
            meta.forEach( function( item ) {
                if ( item instanceof Meta.KeyValue ) {
                    // Update Key/Value
                    // See if it exists in data:
                    var currentValue = KeyHelper.getValueAndRemove( data['data'], item.keyName );
                    if ( currentValue !== undefined ) {
                        item.value = currentValue;
                        parent.push( item.reassemble() );
                        keysAdded[ item.keyName ] = true;
                    }
                    
                } else {
                    // If it's a line break, copy it so that it can be used for generated line breaks
                    if ( item instanceof Meta.LineBreak ) {
                        newLine = item.lineBreak;
                    }
                    // Reassemble as is:
                    parent.push( item.reassemble() );
                }
            });
            // Add other key/value pairs:
            /* TODO:  Fix after fixing the iterate_through_parts implementation in key_helper */
            Object.keys( data['data'] ).forEach( function( key ) {
                if ( ! keysAdded.hasOwnProperty( key ) ) {
                    console.log( ">" + key );
                    parent._process( ( namespace ? namespace : "" ) + key, data['data'][ key ] );
                } else {
                    console.log( "<" + key );
                }
            });
            return;
        }
    }

    switch (typeof data) {
        case 'object':
            if (Array.isArray(data)) {
                data.forEach(function (item) {
                    this._process(namespace, item);
                }.bind(this));
            } else {
                Object.keys(data).forEach(function (key) {
                    var name = namespace ? namespace + '.' + key : key;
                    this._process(name, data[key]);
                }.bind(this));
            }
            break;

        case 'number':
            this._process(namespace, Number.isFinite(data) ? String(data) : '');
            break;

        case 'boolean':
            this._process(namespace, String(data));
            break;

        case 'null':
            this._process(namespace, String(data));
            break;

        case 'string':
            var value = [namespace, '=', data, newLine].join(''); 
            /* It used to be os.EOL.  Changed to newLine, since the file could be produced on a windows machine
             * and processed on a linux server */
            this.push(value);
            break;

        default:
            console.warn('Unserializable value:', data);
    }
};

module.exports = PropertyWriter;
