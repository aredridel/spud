/* Sets the value of 'key' in the object, 'data', to 'value' */
function setValue( data, key, value ) {
	iterateThroughParts( data, key, true, function( curValue, obj, subKey ) {
		obj[ subKey ] = value;
	});
}

/* Gets the value of 'key' in the object, 'data' */
function getValue( data, key ) {
	var toReturn;
	iterateThroughParts( data, key, false, function( value ) {
		if ( value ) {
			toReturn = value;
		}
		return true;
	});
	return toReturn;
}

/* Gets the value of 'key' in the object, 'data', and then removes it */
function getValueAndRemove( data, key ) {
	var toReturn;
	iterateThroughParts( data, key, false, function( value, obj, subKey ) {
		toReturn = value;
		/* Remove object: */
		delete obj[ subKey ];
	});
	clean( data );
	return toReturn;
}

/* Deletes objects in the tree which don't have keys */
function clean( obj ) {
	if ( typeof obj !== 'object' ) {
		return;
	}
	Object.keys( obj ).forEach( function( key ) {
		if ( typeof obj[ key ] === 'object' ) {
			clean( obj[ key ] );
			if ( Object.keys( obj[ key ] ).length === 0 ) {
				delete obj[ key ];
			}
		}
	});
}

/* forMatch is a function which takes three arguments:  the value, the last containing object, the last containing object's key which points to the value */
function iterateThroughParts( data, key, createBranches, forMatch ) {
    var tail = data;
    var keyParts = getKeyParts( key );
    for ( var i = 0; i < keyParts.length; i += 1 ) {
    	var part = keyParts[i];
    	if ( i + 1 === keyParts.length ) {
    		forMatch( tail[ part ], tail, part );
    		return;
    	}

    	if ( tail.hasOwnProperty( part ) ) {
    		tail = tail[ part ];
    	} else {
    		if ( createBranches ) {
    			tail[ part ] = ( typeof keyParts[ i + 1 ] === 'string' ) ? {} : [];
    			tail = tail[ part ];
    		} else {
    			throw new Error('The given key does not exist.');
    		}
    	}
    }
    throw new Error('This code should not be executed.  If it is, there is a bug.');
}

var regNextBreak = /^([^\.\[]+)([\.\[])(.*)$/;
var regValidate = /^[^\.\[\]]+$/;
var regKeySanitization = /\s/g;
var regInBrackets = /^\[([^\[\]]+)\](.*)$/;
var regArrIndex = /^\s*([0-9]+)\s*$/;
var strErrorSyntax = "Illegal key syntax";

/* Split the key up into its sub-keys */
function getKeyParts( key ) {
	var keyParts = [];
    var remaining = key;
    while( remaining.length > 0 ) {
    	switch( remaining.charAt(0) ) {
    		case '[':
    			var results = regInBrackets.exec( remaining );
    			if ( ! results ) {
    				throw new Error( strErrorSyntax );
    			}
    			var arrIndexResults = regArrIndex.exec( results[1] );
    			if ( arrIndexResults ) {
    				keyParts.push( parseInt( arrIndexResults[1], 10 ) );
    			} else {
    				keyParts.push( results[1] );
    			}
    			remaining = results[2];
    			if ( remaining.charAt(0) === '.' ) {
    				remaining = remaining.splice(1);
    			}
    			break;
    		default:
    			var results = regNextBreak.exec( remaining );
		    	if ( ! results ) {
		    		if ( regValidate.test( remaining ) ) {
		    			keyParts.push( remaining.replace(regKeySanitization, '') );
		    			remaining = "";
		    			continue;
		    		} else {
		    			throw new Error( strErrorSyntax );
		    		}
		    	}
		    	keyParts.push( results[1].replace(regKeySanitization, '') );
		    	remaining = ( ( results[2] === '[' ) ? '[' : '' ) + results[3];
    	}
    }
    return keyParts;
}

module.exports = {
	getValue: getValue,
	getValueAndRemove: getValueAndRemove,
	setValue: setValue
};