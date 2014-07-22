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

var util = require('util'),
	Stream = require('stream'),
	codePointAt = require('string.fromcodepoint'),
	AbstractReader = require('../abstractReader'),
    Meta = require('./meta'),
    KeyHelper = require('./key_helper');

function PropertyReader() {
    PropertyReader.super_.call(this);
}

util.inherits(PropertyReader, AbstractReader);

var genParseError = function( lineIndex ) {
    return new Error("Parse error on line " + ( lineIndex + 1 ).toString() )
}

// AND:  (?=\S)(?=[^=])
// White space, but not new line:  [^\S\n]
var reSkip = /^([^\S\n]*)$/;
var reKeyValue = /^([^\S\n]*)([^=]*)+=([^\n]*)$/;
var reComment = /^([^\S\n]*)#([^\n]*)$/;
var lineBreakRegex = /(\r?\n)/;
PropertyReader.prototype._doDeserialize = function(data, callback) {
    var lines = [];
    var remaining = data.slice(0);
    // Identify line breaks and split into lines, which can be any combination of consecutive \n\r
    while ( remaining.length > 0 ) {
        var match = lineBreakRegex.exec( remaining );
        if ( match ) {
            var matched = match[1];  // the combination of \n's and \r's
            var index = match['index']; // the index of the first character in the line break
            var upToMatch = remaining.slice( 0, index ); // the line before the linebreak
            lines.push( upToMatch ); // Add the line to the array
            lines.push( matched ); // Add the line break to the array (so that it isn't lost)
            remaining = remaining.slice( index + matched.length ); // Cut off the piece which was parsed and continue parsing
        } else {
            lines.push( remaining );  // Add the rest of the unparsed data as a line
            remaining = "";
        }
    }
    var data = {}; // For tracking key/value pairs
    var meta = []; // For tracking the structure of the file
    for ( var ln = 0; ln < lines.length; ++ ln ) {
        var line = lines[ln]; // The current line
        var lineBreak = lineBreakRegex.exec( line ); // Check if it's a line break (consisting of \n's and \r's)
        if ( lineBreak ) {
            meta.push( new Meta.LineBreak( lineBreak[1] ) ); // Register it as a line break in the meta data
            continue;
        }
        var skip = reSkip.exec( line ); // Check if it's an empty line
        if ( skip ) {
            meta.push( new Meta.EmptyLine( skip[1] ) ); // Save the whitespace in the meta data
            continue;
        }
        var comment = reComment.exec( line ); // Check if it's a comment
        if ( comment ) {
            meta.push( new Meta.CommentLine( comment[1], comment[2] ) ); // Save the whitespace and comment in the meta data
            continue;
        }
        var keyValue = reKeyValue.exec( line ); // check if it's a key value pair
        if ( keyValue ) {
            var ws1 = keyValue[1]; // The whitespace before the key
            var key = keyValue[2].trim(); // The key
            var ws2 = keyValue[2].substring( key.length ); // the whitespace after the key
            var value = keyValue[3]; // The value

            meta.push( new Meta.KeyValue( ws1, key, ws2, value ) ); // Register metadata before parsing key/value pair

            KeyHelper.setValue( data, key, value );

            continue;
        }
        // Illegal syntax:
        callback( genParseError( ln ) );
        return;
    }
    if ( data['__meta__'] ) {
        throw new Error("Meta property is already defined!");
    }
    data['__meta__'] = meta;
    callback( null, data );
}

module.exports = PropertyReader;
