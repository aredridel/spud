function setValue( data, key, value ) {
	iterateThroughParts( data, key, true, function( curValue, obj, subKey ) {
		obj[ subKey ] = value;
		return true;
	});
}

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

function getValueAndRemove( data, key ) {
	console.log( data );
	console.log( key );
	var toReturn;
	iterateThroughParts( data, key, false, function( value, obj, subKey ) {
		if ( value ) {
			toReturn = value;
		}
		/* Remove object: */
		delete obj[ subKey ];
		return false;
	});
	clean( data );
	console.log( data );
	return toReturn;
}

function clean( obj ) {
	if ( typeof obj !== 'object' ) {
		return;
	}
	Object.keys( obj ).forEach( function( key ) {
		if ( typeof obj[ key ] === 'object' ) {
			if ( Object.keys( obj[ key ] ).length === 0 ) {
				console.log( "Deleting " + key );
				delete obj[ key ];
			} else {
				clean( obj[ key ] );
			}
		}
	});
}

/* REFACTOR AND REWRITE!! */

/* forMatch is a function which takes three arguments:  the value, the last containing object, the last containing object's key which points to the value 
 *  and returns whether or not the search should continue.
 */
function iterateThroughParts( data, key, createBranches, forMatch ) {
	// Parse the key value pair:
    var tail = data;
    var continueSearch = true;
    key.split(/\./).forEach(function (prop, index, arr) {
    	if ( ! continueSearch ) {
    		return;
    	}

        // Sanitize key
        prop = prop.replace(/\s/g, '');
        // Change to allow most any chars for name and map key
        var arrMap = prop.match(/^([^\[]+)\[(.*)\]$/);
        if ( Array.isArray(arrMap) && arrMap.length > 1 ) {
            var arrKey = arrMap[1];
            if ( arrMap[2] !== '' ) {
                // If previous value is present for this key, use it, otherwise new object
                arrMap[2].split(/\]\[/).forEach(function (arrProp, arrIndex, subArr) {
                	console.log( arrProp );
                	if ( ! continueSearch ) {
			    		return;
			    	}
                    // Iterate over the property keys
                    var isArray = arrProp.match(/^[0-9]+$/);
                    var newObj = isArray ? [] : {};
                    /*if ( arrIndex < subArr.length - 1 ) {
                    	tail = tail[arrKey] = (typeof tail[arrKey] !== 'undefined' && typeof tail[arrKey] === 'object') ? tail[arrKey] : newObj;
                    } else {
                    	continueSearch = forMatch( tail[arrProp], tail, arrProp );
                    }*/
                    /*if ( arrProp.match(/^[0-9]+$/) ) {
                        if ( arrIndex === 0 ) {
                            tail = tail[arrKey] = (typeof tail[arrKey] !== 'undefined' && typeof tail[arrKey] === 'object') ? tail[arrKey] : [];
                        }
                        // Assign the value if it's the last key in the set
                        // tail[arrProp] = ( arrIndex === subArr.length - 1 ) ? value : tail[arrProp] || [];
                        continueSearch = forMatch( tail[arrProp], tail, arrProp );
                    } else {
                        if ( arrIndex === 0 ) {
                            tail = tail[arrKey] = (typeof tail[arrKey] !== 'undefined' && typeof tail[arrKey] === 'object') ? tail[arrKey] : {};
                        }
                        // Assign the value if it's the last key in the set
                        // tail[arrProp] = ( arrIndex === subArr.length - 1 ) ? value : tail[arrProp] || {};
                        continueSearch = forMatch( tail[arrProp], tail, arrProp );
                    }*/
                    if ( arrIndex === subArr.length - 1 ) {
                    	continueSearch = forMatch( tail[ arrProp ], tail, arrProp );
                    	return;
                    }
                    /* End of the branch reached */
                    if ( tail[arrProp] === undefined ) {
                    	if ( createBranches ) {
                    		/* Create a new branch to get to the end */
                    		tail[arrProp] = newObj;
                    	} else {
                    		/* Exit */
                    		continueSearch = false;
                    		return;
                    	}
                    } else { /* Branch continues */
                    	/* If the next step isn't an object, there is a problem, because we can't look for it's keys */
                    	if ( typeof tail !== "object" ) {
                    		throw new Error( "Conflicting values for key " + key );
                    	}
                    }
                    /* Keep traversing the tree */
                    tail = tail[arrProp];
                });
            }
        } else if (index === arr.length - 1) {
            // On the final property in the namespace
            // Property wasn't yet defined, so just set a value
            // tail[prop] = value;
            continueSearch = forMatch( tail[prop], tail, prop );
        } else {
            // Continue through the namespace. If a property
            // was defined in a previous iteration, use it,
            // otherwise, create an empty object and move on.
            tail = tail[prop] = (tail[prop] || {});
        }
    });
}

module.exports = {
	getValue: getValue,
	getValueAndRemove: getValueAndRemove,
	setValue: setValue
};