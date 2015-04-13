var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
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
        return this.readWhile(function (ch) {
            return /^\s$/.test(ch);
        });
    };

    StringReader.prototype.readNaturalNumber = function () {
        var num = this.readWhile(function (ch) {
            return /^[0-9]$/.test(ch);
        });
        return num == "" ? null : parseInt(num);
    };

    StringReader.prototype.readToken = function () {
        return this.readWhile(function (ch) {
            return /^[a-zA-Z0-9_]$/.test(ch);
        });
    };

    StringReader.prototype.readChar = function (expected) {
        var b = true;
        return this.readWhile(function (ch) {
            if (!b)
                return false;
            b = false;
            return ch == expected;
        }).length == 1;
    };

    Object.defineProperty(StringReader.prototype, "charsLeft", {
        get: function () {
            return this.len - this.index;
        },
        enumerable: true,
        configurable: true
    });
    return StringReader;
})();

var Runtime = (function () {
    function Runtime() {
        var _this = this;
        this.defs = {};
        this.defs["i"] = new BuiltinExpression("i", function (stack) {
            return stack.length >= 1;
        });
        this.defs["k"] = new BuiltinExpression("k", function (stack) {
            return stack.length >= 2;
        }, function (stack) {
            var x = stack.pop();
            stack.pop();
            stack.push(x);
        });
        this.defs["s"] = new BuiltinExpression("s", function (stack) {
            return stack.length >= 3;
        }, function (stack) {
            var a = stack.pop();
            var b = stack.pop();
            var c = stack.pop();
            stack.push(Expression.createApplication(a, c, Expression.createApplication(b, c)));
        });
        this.defs["b"] = new BuiltinExpression("b", function (stack) {
            return stack.length >= 3;
        }, function (stack) {
            var a = stack.pop();
            var b = stack.pop();
            var c = stack.pop();
            stack.push(Expression.createApplication(a, Expression.createApplication(b, c)));
        });
        this.defs["c"] = new BuiltinExpression("c", function (stack) {
            return stack.length >= 3;
        }, function (stack) {
            var a = stack.pop();
            var b = stack.pop();
            var c = stack.pop();
            stack.push(Expression.createApplication(a, c, b));
        });
        this.defs["u"] = new BuiltinExpression("u", function (stack) {
            return stack.length >= 1;
        }, function (stack) {
            var x = stack.pop();
            stack.push(_this.defs["k"]);
            stack.push(_this.defs["s"]);
            stack.push(x);
        });

        this.defs["msgBox"] = new BuiltinExpression("msgBox", function (stack) {
            return stack.length >= 1;
        }, function (stack) {
            return window.alert(stack[stack.length - 1].toString());
        });
    }
    Runtime.create = function (binary) {
        var rt = new Runtime();
        rt.define(binary);
        return rt;
    };

    Runtime.prototype.define = function (binaryDefinition) {
        var reader = new StringReader(binaryDefinition);

        reader.readWhitespace();
        while (reader.charsLeft > 0) {
            // begin parse definition
            var name = reader.readToken();

            var expressionStack = [];

            while (true) {
                reader.readWhitespace();

                // apply
                if (reader.readChar(".")) {
                    if (expressionStack.length < 2)
                        break;
                    var b = expressionStack.pop();
                    var a = expressionStack.pop();
                    if (a instanceof Expression) {
                        a.stack.unshift(b);
                        expressionStack.push(a);
                    } else {
                        expressionStack.push(Expression.createApplication(a, b));
                    }
                    continue;
                }

                // num
                var num = reader.readNaturalNumber();
                if (num != null) {
                    expressionStack.push(Expression.createNumber(num));
                    continue;
                }

                // string
                if (reader.readChar("\"")) {
                    var s = reader.readWhile(function (ch) {
                        return ch != "\"";
                    });
                    reader.readChar("\"");
                    expressionStack.push(Expression.createString(s));
                    continue;
                }

                // defref
                var defRef = reader.readToken();
                var def = this.defs[defRef];
                if (def == undefined)
                    throw "undefined reference: " + defRef;
                expressionStack.push(def);
            }

            if (this.defs[name] == undefined) {
                var content = expressionStack.pop();
                console.log(name + " = " + content.toString());
                this.defs[name] = (function (content) {
                    return new BuiltinExpression(name, function (stack) {
                        return true;
                    }, function (stack) {
                        return stack.push(content);
                    });
                })(content);
            }

            // end parse definition
            reader.readWhitespace();
        }
    };
    return Runtime;
})();

var ExpressionBase = (function () {
    function ExpressionBase() {
    }
    ExpressionBase.prototype.apply = function (stack) {
        return false;
    };
    ExpressionBase.prototype.reduce = function () {
        return false;
    };
    ExpressionBase.prototype.fullReduce = function () {
        while (this.reduce())
            ;
    };

    ExpressionBase.prototype.asNumber = function () {
        var n = 0;
        var probeN;
        var probeZero = new BuiltinExpression("probeZero", function (stack) {
            return false;
        });
        var probeSucc = new BuiltinExpression("probeSucc", function (stack) {
            return stack.length >= 1;
        }, function (stack) {
            n++;
            stack.push(Expression.createApplication(probeN, stack.pop()));
        });
        probeN = new BuiltinExpression("probeN", function (stack) {
            return stack.length >= 1;
        }, function (stack) {
            var num = stack.pop();
            stack.push(probeSucc);
            stack.push(probeZero);
            stack.push(num);
        });

        var expr = Expression.createApplication(probeN, this);
        expr.fullReduce();
        return n;
    };
    return ExpressionBase;
})();

var Expression = (function (_super) {
    __extends(Expression, _super);
    function Expression() {
        _super.call(this);
        this.stack = [];
    }
    Expression.createADTo = function (arity, index) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 2); _i++) {
            args[_i] = arguments[_i + 2];
        }
        return new BuiltinExpression("ADTo_" + index + "_" + arity, function (stack) {
            return stack.length >= arity;
        }, function (stack) {
            var result;
            for (var i = 0; i < arity; i++)
                if (i == index)
                    result = Expression.createApplication.apply(null, [stack.pop()].concat(args));
                else
                    stack.pop();
            return result;
        });
    };
    Expression.createNumber = function (n) {
        var res = Expression.createADTo(2, 0);
        while (n-- != 0)
            res = Expression.createADTo(2, 1, res);
        return res;
    };
    Expression.createList = function (exprs) {
        var res = Expression.createADTo(2, 0);
        exprs.forEach(function (ex) {
            return res = Expression.createADTo(2, 1, ex, res);
        });
        return res;
    };
    Expression.createString = function (s) {
        return Expression.createList(s.split("").map(function (ch) {
            return Expression.createNumber(ch.charCodeAt(0));
        }));
    };

    Expression.createApplication = function () {
        var expressions = [];
        for (var _i = 0; _i < (arguments.length - 0); _i++) {
            expressions[_i] = arguments[_i + 0];
        }
        var e = new Expression();
        Array.prototype.push.apply(e.stack, expressions);
        e.stack.reverse();
        return e;
    };

    Expression.createDummy = function (name) {
        return new BuiltinExpression(name, function (stack) {
            return false;
        });
    };

    Expression.prototype.apply = function (stack) {
        Array.prototype.push.apply(stack, this.stack);
        return true;
    };

    Expression.prototype.reduce = function () {
        var top = this.stack.pop();
        if (top.reduce())
            this.stack.push(top);
        else if (!top.apply(this.stack)) {
            this.stack.push(top);
            return false;
        }
        return true;
    };

    Expression.prototype.toString = function () {
        var res = "";
        this.stack.forEach(function (x) {
            return res = x.toString() + " " + res;
        });
        return "(" + res.trim() + ")";
    };
    return Expression;
})(ExpressionBase);
var BuiltinExpression = (function (_super) {
    __extends(BuiltinExpression, _super);
    function BuiltinExpression(name, test, applyTo) {
        if (typeof applyTo === "undefined") { applyTo = function (x) {
        }; }
        _super.call(this);
        this.name = name;
        this.test = test;
        this.applyTo = applyTo;
    }
    BuiltinExpression.prototype.apply = function (stack) {
        var result = this.test(stack);
        if (result)
            this.applyTo(stack);
        return result;
    };

    BuiltinExpression.prototype.reduce = function () {
        return false;
    };

    BuiltinExpression.prototype.toString = function () {
        return this.name;
    };
    return BuiltinExpression;
})(ExpressionBase);
