var util = require('util');

function MetaObject() { }

MetaObject.prototype.reassemble = function() {
    throw new Error( "This is an abstract object:  the 'reassemble' function is not implemented." );
}

util.inherits( LineBreak, MetaObject );
util.inherits( EmptyLine, MetaObject );
util.inherits( CommentLine, MetaObject );
util.inherits( KeyValue, MetaObject );

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

module.exports = {
    LineBreak: LineBreak,
    EmptyLine: EmptyLine,
    CommentLine: CommentLine,
    KeyValue: KeyValue
};