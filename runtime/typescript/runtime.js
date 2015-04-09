var StringReader = (function () {
    function StringReader(str) {
        this.str = str;
        this.index = 0;
        this.len = str.length;
    }
    StringReader.prototype.readWhile = function (pred) {
        var start = this.index;
        while (this.index < this.len && pred(this.str[this.index]))
            this.index++;
        return this.str.slice(start, this.index);
    };

    StringReader.prototype.readWhitespace = function () {
        return readWhile(function (ch) {
            return /^\s$/.test(ch);
        });
    };

    StringReader.prototype.readToken = function () {
        return readWhile(function (ch) {
            return /^[a-zA-Z0-9]$/.test(ch);
        });
    };
    return StringReader;
})();

var Runtime = (function () {
    function Runtime() {
    }
    Runtime.create = function (binary) {
        var rt = new Runtime();
        binary.split("\n").forEach(function (s) {
            return rt.define(s);
        });
        return rt;
    };

    Runtime.prototype.define = function (binaryDefinition) {
        window.alert(binaryDefinition);
    };
    return Runtime;
})();

var Expression = (function () {
    function Expression() {
    }
    return Expression;
})();
