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
        return this.readWhile(function (ch) { return /^\s$/.test(ch); });
    };
    StringReader.prototype.readNaturalNumber = function () {
        var num = this.readWhile(function (ch) { return /^[0-9]$/.test(ch); });
        return num == "" ? null : parseInt(num);
    };
    StringReader.prototype.readToken = function () {
        return this.readWhile(function (ch) { return /^[a-zA-Z0-9_]$/.test(ch); });
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
        var def = function (name, expr) {
            _this.defs[name] = new AliasExpression(name, expr);
        };
        def("i", new BuiltinExpression(function (stack) { return stack.length >= 0; }));
        def("k", new BuiltinExpression(function (stack) { return stack.length >= 2; }, function (stack) {
            var x = stack.pop();
            stack.pop();
            stack.push(x);
        }));
        def("s", new BuiltinExpression(function (stack) { return stack.length >= 3; }, function (stack) {
            var a = stack.pop();
            var b = stack.pop();
            var c = stack.pop();
            stack.push(Expression.createApplication(b, c));
            stack.push(c);
            stack.push(a);
        }));
        def("b", new BuiltinExpression(function (stack) { return stack.length >= 3; }, function (stack) {
            var a = stack.pop();
            var b = stack.pop();
            var c = stack.pop();
            stack.push(Expression.createApplication(b, c));
            stack.push(a);
        }));
        def("c", new BuiltinExpression(function (stack) { return stack.length >= 3; }, function (stack) {
            var a = stack.pop();
            var b = stack.pop();
            var c = stack.pop();
            stack.push(b);
            stack.push(c);
            stack.push(a);
        }));
        def("u", new BuiltinExpression(function (stack) { return stack.length >= 1; }, function (stack) {
            var x = stack.pop();
            stack.push(_this.defs["k"]);
            stack.push(_this.defs["s"]);
            stack.push(x);
        }));
        def("add", new BuiltinExpression(function (stack) { return stack.length >= 2; }, function (stack) {
            var x = stack.pop().asNumber();
            var y = stack.pop().asNumber();
            stack.push(ShortcutExpression.createNumber(x + y));
        }));
        def("sub", new BuiltinExpression(function (stack) { return stack.length >= 2; }, function (stack) {
            var x = stack.pop().asNumber();
            var y = stack.pop().asNumber();
            stack.push(ShortcutExpression.createNumber(x - y));
        }));
        def("strCons", new BuiltinExpression(function (stack) { return stack.length >= 2; }, function (stack) {
            var x = stack.pop().asString();
            var y = stack.pop().asString();
            stack.push(ShortcutExpression.createString(x + y));
        }));
        def("msgBox", new BuiltinExpression(function (stack) { return stack.length >= 1; }, function (stack) { return window.alert(stack[stack.length - 1].toString()); }));
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
                    }
                    else {
                        expressionStack.push(Expression.createApplication(a, b));
                    }
                    continue;
                }
                // num
                var num = reader.readNaturalNumber();
                if (num != null) {
                    expressionStack.push(ShortcutExpression.createNumber(num));
                    continue;
                }
                // string
                if (reader.readChar("\"")) {
                    var s = reader.readWhile(function (ch) { return ch != "\""; });
                    reader.readChar("\"");
                    expressionStack.push(ShortcutExpression.createString(s));
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
                    return new AliasExpression(name, content);
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
            ExpressionBase.reductions++;
    };
    ExpressionBase.prototype.asNumber = function () {
        var n = 0;
        var probeN;
        var probeZero = new BuiltinExpression(function (stack) { return false; });
        var probeSucc = new BuiltinExpression(function (stack) { return stack.length >= 1; }, function (stack) {
            n++;
            stack.push(probeN);
        });
        probeN = new BuiltinExpression(function (stack) { return stack.length >= 1; }, function (stack) {
            var num = stack.pop();
            if (ShortcutExpression.isType(num, 0 /* N */)) {
                n += num.asNumber();
                return;
            }
            stack.push(probeSucc);
            stack.push(probeZero);
            stack.push(num);
        });
        var expr = Expression.createApplication(probeN, this);
        expr.fullReduce();
        return n;
    };
    ExpressionBase.prototype.asString = function () {
        var s = "";
        var probeS;
        var probeEmpty = new BuiltinExpression(function (stack) { return false; });
        var probeCons = new BuiltinExpression(function (stack) { return stack.length >= 2; }, function (stack) {
            s += String.fromCharCode(stack.pop().asNumber());
            stack.push(probeS);
        });
        probeS = new BuiltinExpression(function (stack) { return stack.length >= 1; }, function (stack) {
            var num = stack.pop();
            if (ShortcutExpression.isType(num, 1 /* S */)) {
                s += num.asString();
                return;
            }
            stack.push(probeCons);
            stack.push(probeEmpty);
            stack.push(num);
        });
        var expr = Expression.createApplication(probeS, this);
        expr.fullReduce();
        return s;
    };
    ExpressionBase.reductions = 0;
    return ExpressionBase;
})();
var AliasExpression = (function (_super) {
    __extends(AliasExpression, _super);
    function AliasExpression(alias, slave) {
        _super.call(this);
        this.alias = alias;
        this.slave = slave;
        this.called = 0;
    }
    AliasExpression.prototype.apply = function (stack) {
        this.called++;
        return this.slave.apply(stack);
    };
    AliasExpression.prototype.reduce = function () {
        return this.slave.reduce();
    };
    AliasExpression.prototype.toString = function () {
        // DEBUG
        //if (arguments.callee.caller == null 
        //|| arguments.callee.caller.toString().indexOf("toString") == -1)
        //    return this.slave.toString();
        return this.alias;
    };
    return AliasExpression;
})(ExpressionBase);
var ShortcutType;
(function (ShortcutType) {
    ShortcutType[ShortcutType["N"] = 0] = "N";
    ShortcutType[ShortcutType["S"] = 1] = "S";
})(ShortcutType || (ShortcutType = {}));
var ShortcutExpression = (function (_super) {
    __extends(ShortcutExpression, _super);
    function ShortcutExpression(stype, value, alias, slave) {
        _super.call(this, alias, slave);
        this.stype = stype;
        this.value = value;
    }
    ShortcutExpression.createNumber = function (n) {
        var res = Expression.createADTo(2, 0);
        for (var i = 0; i < n; i++)
            res = Expression.createADTo(2, 1, res);
        var se = new ShortcutExpression(0 /* N */, n, n.toString(), res);
        se.asNumber = function () { return n; };
        return se;
    };
    ShortcutExpression.createList = function (exprs) {
        var res = Expression.createADTo(2, 0);
        for (var i = exprs.length - 1; i >= 0; i--)
            res = Expression.createADTo(2, 1, exprs[i], res);
        return res;
    };
    ShortcutExpression.createString = function (s) {
        var list = ShortcutExpression.createList(s.split("").map(function (ch) { return ShortcutExpression.createNumber(ch.charCodeAt(0)); }));
        var se = new ShortcutExpression(1 /* S */, s, "\"" + s + "\"", list);
        se.asString = function () { return s; };
        return se;
    };
    ShortcutExpression.isType = function (expression, stype) {
        return expression.stype == stype;
    };
    return ShortcutExpression;
})(AliasExpression);
var Expression = (function (_super) {
    __extends(Expression, _super);
    function Expression() {
        _super.call(this);
        this.hnf = false;
        this.stack = [];
    }
    Expression.createADTo = function (arity, index) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        return new AliasExpression("ADTo_" + index + "_" + arity, new BuiltinExpression(function (stack) { return stack.length >= arity; }, function (stack) {
            var head = stack[stack.length - index - 1];
            for (var i = 0; i < arity; i++)
                stack.pop();
            for (var i = args.length - 1; i >= 0; i--)
                stack.push(args[i]);
            stack.push(head);
        }));
    };
    Expression.createApplication = function (a, b) {
        var e = new Expression();
        e.stack.push(b);
        e.stack.push(a);
        return e;
    };
    Expression.createApplicationx = function () {
        var expressions = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            expressions[_i - 0] = arguments[_i];
        }
        var e = new Expression();
        Array.prototype.push.apply(e.stack, expressions);
        e.stack.reverse();
        return e;
    };
    Expression.createDummy = function (name) {
        return new AliasExpression(name, new BuiltinExpression(function (stack) { return false; }));
    };
    Expression.prototype.apply = function (stack) {
        Array.prototype.push.apply(stack, this.stack);
        return true;
    };
    Expression.prototype.reduce = function () {
        if (this.hnf || this.stack.length == 0)
            return false;
        var exprs = this.leftmostExprs;
        while (exprs.length > 0) {
            var stack = exprs.pop().stack;
            var top = stack.pop();
            if (top.reduce()) {
                stack.push(top);
                return true;
            }
            else if (!top.apply(stack))
                stack.push(top);
            else
                return true;
        }
        this.hnf = true;
        return false;
    };
    Object.defineProperty(Expression.prototype, "top", {
        get: function () {
            return this.stack[this.stack.length - 1];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Expression.prototype, "leftmostExprs", {
        get: function () {
            var expr = [this];
            while (true) {
                var top = expr[expr.length - 1].top;
                if (top instanceof Expression && top.stack.length > 0)
                    expr.push(top);
                else
                    return expr;
            }
        },
        enumerable: true,
        configurable: true
    });
    Expression.prototype.toString = function () {
        var res = "";
        this.stack.forEach(function (x) { return res = x.toString() + " " + res; });
        return "(" + res.trim() + ")";
    };
    return Expression;
})(ExpressionBase);
var BuiltinExpression = (function (_super) {
    __extends(BuiltinExpression, _super);
    function BuiltinExpression(test, applyTo) {
        if (applyTo === void 0) { applyTo = function (x) {
        }; }
        _super.call(this);
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
    return BuiltinExpression;
})(ExpressionBase);
//# sourceMappingURL=runtime.js.map