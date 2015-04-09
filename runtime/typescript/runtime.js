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
