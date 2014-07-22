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

function  getEscapedChar(match) {
	match = match.substring(2).replace(/[\{\}]/g, '');
	return String.fromCodePoint(parseInt(match, 16));
}

/* forMatch is a function which takes three arguments:  the value, the last containing object, the last containing object's key which points to the value */
function iterateThroughParts( data, key, createBranches, forMatch ) {
    var tail = data;
    /* Parse the key: */
    var keyParts = getKeyParts( key );
    /* Iterate through the key's parts: */
    for ( var i = 0; i < keyParts.length; i += 1 ) {

    	var part = keyParts[i];

    	/* If it's the last subkey, call the callback */
    	if ( i + 1 === keyParts.length ) {
    		forMatch( tail[ part ], tail, part );
    		return;
    	}

    	/* Check if the current namespace contains the subkey */
    	if ( tail.hasOwnProperty( part ) ) {
    		/* if so, continue to traverse tree */
    		tail = tail[ part ];
    	} else {
    		/* Otherwise...*/
    		if ( createBranches ) {
    			/* If allowed to create new objects in the tree, do so by creating a new object or array for the subkey */
    			tail[ part ] = ( typeof keyParts[ i + 1 ] === 'string' ) ? {} : [];
    			/* continue to traverse tree */
    			tail = tail[ part ];
    		} else {
    			/* if not allowed, the key doesn't exist in the tree */
    			throw new Error('The given key does not exist.');
    		}
    	}
    }
    /* The function should have returned before this point.  The throw statement is just a safety feature to ensure that */
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
	/* Trim the key */
	key = key.trim();
	var keyParts = [];
    var remaining = key;
    /* Continue looping until the entire key is parsed: */
    while( remaining.length > 0 ) {
    	/* Check to see if the first character in the next sub key is a square bracket */
    	switch( remaining.charAt(0) ) {
    		case '[':
    			/* Look for an end bracket and validate syntax */
    			var results = regInBrackets.exec( remaining );
    			if ( ! results ) {
    				throw new Error( strErrorSyntax );
    			}
    			/* Check if the key is an integer -> if so, parse it */
    			var arrIndexResults = regArrIndex.exec( results[1] );
    			if ( arrIndexResults ) {
    				/* Parse the integer and add ot key parts array */
    				keyParts.push( parseInt( arrIndexResults[1], 10 ) );
    			} else {
    				/* Add the string to the key parts array */
    				keyParts.push( results[1] );
    			}
    			/* Get the rest of the string which hasn't been parsed yet: */
    			remaining = results[2];
    			/* If there are still characters remaining: */
    			if ( remaining.length > 0 ) {
	    			/* Check to see if the next subkey starts with a . (or, conversely, with a square bracket) */
	    			if ( remaining.charAt(0) === '.' ) {
	    				remaining = remaining.splice(1);
	    			} else if ( remaining.charAt(0) === '[' ) {
	    				/* No action required */
	    			} else {
	    				/* If it doesn't start with a period of a square bracket, then throw a syntax error */
	    				throw new Error( strErrorSyntax );
	    			}
	    		}
    			break;
    		default:
    			/* Look for the next divider (period or square bracket) */
    			var results = regNextBreak.exec( remaining );
		    	if ( ! results ) {
		    		/* If there isn't one: */
		    		/* Check to see if the rest of the key could be a subkey: */
		    		if ( regValidate.test( remaining ) ) {
		    			/* If it can, then add it as the last subkey and return */
		    			keyParts.push( remaining.replace(regKeySanitization, '') );
		    			remaining = "";
		    			continue;
		    		} else {
		    			/* Otherwise, throw a syntax error: */
		    			throw new Error( strErrorSyntax );
		    		}
		    	}
		    	/* If the next divider exists, sanitize the subkey and add it to the key parts array */
		    	keyParts.push( results[1].replace(regKeySanitization, '') );
		    	/* If the divider was a square bracket, add a square bracket onto the remaining string so that the case '[' executes properly next iteration */
		    	remaining = ( ( results[2] === '[' ) ? '[' : '' ) + results[3];
    	}
    }
    /* Handle escaped characters: */
    for ( var i = 0; i < keyParts.length; i += 1 ) {
    	if ( keyParts[i].indexOf('\\u') !== -1 ) {
            //ES6 format: \u{xxxxxx}
            if ( keyParts[i].indexOf('\\u{') !== -1 ) {
                keyParts[i] = keyParts[i].replace(/(\\u\{[A-Z0-9]{1,6}})/gi, getEscapedChar);
            } else {
                keyParts[i] = keyParts[i].replace(/(\\u[A-Z0-9]{4})/gi, getEscapedChar);
            }
        }
    }
    return keyParts;
}

module.exports = {
	clean: clean,
	getValue: getValue,
	getValueAndRemove: getValueAndRemove,
	setValue: setValue
};