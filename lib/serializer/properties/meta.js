var Meta = ( function() {
    /* Let ws = whitespace */

    function LineBreak( lineBreak ) {
        if ( ! lineBreak ) {
            lineBreak = "\n";
        }
        this.lineBreak = lineBreak;
    }
    LineBreak.prototype.reassemble = function() {
        return this.lineBreak;
    };

    function EmptyLine( ws ) {
        this.ws = ws;
    }
    EmptyLine.prototype.reassemble = function() {
        return this.ws;
    };

    function CommentLine( preceedingWs, comment ) {
        this.preceedingWs = preceedingWs;
        this.comment = comment;
    }
    CommentLine.prototype.reassemble = function() {
        return this.preceedingWs.concat( "#", this.comment );
    };

    function CommandTranslate( preceedingWs, preCommandWs, command, postCommandWs, preValueWs, value, postValueWs) {
        this.preceedingWs = preceedingWs;
        this.preCommandWs = preCommandWs;
        this.command = command;
        this.postCommandWs = postCommandWs;
        this.preValueWs = preValueWs;
        this.value = value;
        this.postValueWs = postValueWs;
    }
    CommandTranslate.prototype.reassemble = function() {
        return this.preceedingWs.concat( "#", this.preCommandWs, this.command, this.postCommandWs, ":", this.preValueWs, this.value, this.postValueWs );
    };

    function KeyValue( preceedingWs, keyName, postKeyWs, value ) {
        this.preceedingWs = preceedingWs;
        this.keyName = keyName;
        this.postKeyWs = postKeyWs;
        this.value = value;
    }
    KeyValue.prototype.reassemble = function( data ) {
        if ( data ) {
            if ( data.hasOwnProperty( this.keyName ) ) {
                return this.preceedingWs.concat( this.keyName, this.postKeyWs, "=", data[ this.keyName ] );
            } else {
                throw new Error("Key does not exist in object.");
            }
        } else {
            return this.preceedingWs.concat( this.keyName, this.postKeyWs, "=", this.value );
        }
    };

    var reassemble = function( parts, data ) {
        var translating = true;
        var out = "";
        var lineBreak = "\n";
        var i;
        for ( i = 0; i < parts.length; i += 1 ) {
            if ( parts[i] instanceof LineBreak ) {
                lineBreak = parts[i].lineBreak;
                break;
            }
        }
        for ( i = 0; i < parts.length; i += 1 ) {
            if ( parts[i] instanceof CommandTranslate ) {
                translating = ( parts[i].value.toLowerCase() === "true" );
            }
            if ( parts[i] instanceof KeyValue ) {
                if ( data && ! ( parts[i].keyName in data ) ) {
                    continue; /* Skip it, the key has since been removed.  TODO:  throw error? */
                }
                if ( data[ parts[i].keyName ].options.doNotTranslate === translating ) {
                    translating = ! translating;
                    out = out.concat( "# translate: ", translating.toString(), lineBreak );
                }
            }
            out = out.concat( parts[i].reassemble( data ) );
        }
        return out;
    };

    return {
        LineBreak: LineBreak,
        EmptyLine: EmptyLine,
        CommentLine: CommentLine,
        CommandTranslate: CommandTranslate,
        KeyValue: KeyValue,

        reassemble: reassemble
    };

})();

module.exports = Meta;
