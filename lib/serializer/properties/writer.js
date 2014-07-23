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

ReadStream.prototype._process = function (namespace, data, newLine, keysAdded ) {

    // TODO: Some more work in this direction to make it
    // super fast, if necessary.

    if ( ! keysAdded ) {
        keysAdded = {};
    }

    /* Set parent context for function scope: */
    var parent = this;

    /* Set default new line character */
    if ( ! newLine ) {
        newLine = os.EOL;
    }
    /* Try to fit to preexisting meta data to avoid loss: */
    if ( typeof data === 'object' ) {
        var meta = data.__meta__;
        if ( meta ) {
            /* Meta approach is applicable */
            meta.forEach( function( item ) {
                if ( item instanceof Meta.KeyValue ) {
                    /* Update Key/Value */
                    /* See if it exists in data and if it does, get its value: */
                    var currentValue = KeyHelper.getValue( data, item.keyName );
                    if ( currentValue !== undefined ) {
                        /* If the key exists in data, update its value and print */
                        item.value = currentValue;
                        parent.push( item.reassemble() );
                        keysAdded[ JSON.stringify( KeyHelper.getKeyParts( item.keyName ) ) ] = true;
                    }
                    /* ( otherwise, if it doesn't exist in data, ignore it and don't print! ) */
                    
                } else {
                    /* If it's some other meta, like a comment or a line break, print it out: */
                    /* If it's a line break, copy it so that it can be used for generated line breaks */
                    if ( item instanceof Meta.LineBreak ) {
                        newLine = item.lineBreak;
                    }
                    /* Reassemble meta element as is: */
                    parent.push( item.reassemble() );
                }
            });
            /* Append other keys which weren't contained in __meta__: */
            Object.keys( data ).forEach( function( key ) {
                if ( key === '__meta__' ) {
                    return;
                }
                parent._process( ( namespace ? namespace : "" ) + key, data[ key ], newLine, keysAdded );
            });
            return;
        }
    }

    /* Normal, pre-existing process (now used only for new keys): */
    switch (typeof data) {
        case 'object':
            if (Array.isArray(data)) {
                data.forEach(function (item) {
                    this._process(namespace, item, newLine, keysAdded);
                }.bind(this));
            } else {
                Object.keys(data).forEach(function (key) {
                    var name = key;
                    if ( namespace ) {
                        if ( /^[0-9]$/.test( key.charAt(0) ) || ! /^\S*$/.test( key ) ) {
                            name = namespace + "[" + key + "]";
                        } else {
                            name = namespace + "." + key;
                        }
                    }
                    this._process(name, data[key], newLine, keysAdded);
                }.bind(this));
            }
            break;

        case 'number':
            this._process(namespace, Number.isFinite(data) ? String(data) : '', newLine, keysAdded);
            break;

        case 'boolean':
            this._process(namespace, String(data), newLine, keysAdded);
            break;

        case 'null':
            this._process(namespace, String(data), newLine, keysAdded);
            break;

        case 'string':
            var adaptedKey = JSON.stringify( KeyHelper.getKeyParts( namespace ) );
            if ( ! keysAdded[ adaptedKey ] ) {
                var value = [namespace, '=', data, newLine].join(''); 
                keysAdded[ adaptedKey ] = true;
                this.push(value);
            } /* Otherwise, the key already exists */
            break;

        default:
            throw new Error('Unserializable value:', data);
    }
};

module.exports = PropertyWriter;
