var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var LambadaRuntimeMinimal;
(function (LambadaRuntimeMinimal) {
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
    var ExpressionBase = (function () {
        function ExpressionBase() {
        }
        ExpressionBase.init = function () {
            ExpressionBase.probeSTOP = new BuiltinExpression(undefined);
        };
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
            var probeSucc = new BuiltinExpression(1, function (stack) {
                n++;
                stack.push(probeN);
            });
            probeN = new BuiltinExpression(1, function (stack) {
                var num = stack.pop();
                stack.push(probeSucc);
                stack.push(ExpressionBase.probeSTOP);
                stack.push(num);
            });
            var expr = Expression.createApplication(probeN, this);
            expr.fullReduce();
            return n;
        };
        ExpressionBase.prototype.asString = function () {
            var s = "";
            var probeS;
            var probeCons = new BuiltinExpression(2, function (stack) {
                s += String.fromCharCode(stack.pop().asNumber());
                stack.push(probeS);
            });
            probeS = new BuiltinExpression(1, function (stack) {
                var num = stack.pop();
                stack.push(probeCons);
                stack.push(ExpressionBase.probeSTOP);
                stack.push(num);
            });
            var expr = Expression.createApplication(probeS, this);
            expr.fullReduce();
            return s;
        };
        return ExpressionBase;
    })();
    var BuiltinExpression = (function (_super) {
        __extends(BuiltinExpression, _super);
        function BuiltinExpression(arity, applyTo) {
            if (applyTo === void 0) { applyTo = function (x) {
            }; }
            _super.call(this);
            this.arity = arity;
            this.applyTo = applyTo;
        }
        BuiltinExpression.prototype.apply = function (stack) {
            if (stack.length >= this.arity) {
                this.applyTo(stack);
                return true;
            }
            return false;
        };
        return BuiltinExpression;
    })(ExpressionBase);
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
        AliasExpression.prototype.fullReduce = function () {
            this.slave.fullReduce();
        };
        AliasExpression.prototype.toString = function () {
            return this.alias;
        };
        return AliasExpression;
    })(ExpressionBase);
    var Expression = (function (_super) {
        __extends(Expression, _super);
        function Expression() {
            _super.call(this);
            this.stack = [];
        }
        Expression.createADTo = function (arity, index) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            return new BuiltinExpression(arity, function (stack) {
                var head = stack[stack.length - index - 1];
                for (var i = 0; i < arity; i++)
                    stack.pop();
                for (var i = args.length - 1; i >= 0; i--)
                    stack.push(args[i]());
                stack.push(head);
            });
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
        Expression.prototype.apply = function (stack) {
            Array.prototype.push.apply(stack, this.stack);
            return true;
        };
        Expression.prototype.reduce = function () {
            if (this.stack.length == 0)
                return false;
            var exprs = [this];
            while (true) {
                var top = exprs[exprs.length - 1].top;
                if (top instanceof Expression && top.stack.length > 0)
                    exprs.push(top);
                else
                    break;
            }
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
            return false;
        };
        Object.defineProperty(Expression.prototype, "top", {
            get: function () {
                return this.stack[this.stack.length - 1];
            },
            enumerable: true,
            configurable: true
        });
        Expression.prototype.toString = function () {
            var _this = this;
            var res = "";
            this.stack.forEach(function (x, i) { return res = (i == _this.stack.length - 1 ? x.toString() : "(" + x.toString() + ")") + " " + res; });
            return res.trim();
        };
        return Expression;
    })(ExpressionBase);
    LambadaRuntimeMinimal.Expression = Expression;
    var ShortcutExpression = (function () {
        function ShortcutExpression() {
        }
        ShortcutExpression.createNumber = function (n) {
            var se = n == 0 ? ShortcutExpression.ADTo_2_0 : Expression.createADTo(2, 1, function () { return ShortcutExpression.createNumber(n - 1); });
            se._asNumber = se.asNumber = function () { return n; };
            se.toString = function () { return n.toString(); };
            return se;
        };
        ShortcutExpression.createString2 = function (s, offset) {
            var se = s.length == offset ? ShortcutExpression.ADTo_2_0 : Expression.createADTo(2, 1, function () { return ShortcutExpression.createNumber(s.charCodeAt(offset)); }, function () { return ShortcutExpression.createString2(s, offset + 1); });
            se._asString = se.asString = function () { return s.slice(offset); };
            se.toString = function () { return "\"" + s.slice(offset) + "\""; };
            return se;
        };
        ShortcutExpression.createString = function (s) {
            return ShortcutExpression.createString2(s, 0);
        };
        ShortcutExpression.createBoolean = function (b) {
            return b ? ShortcutExpression.ADTo_2_0 : ShortcutExpression.ADTo_2_1;
        };
        ShortcutExpression.ADTo_2_0 = Expression.createADTo(2, 0);
        ShortcutExpression.ADTo_2_1 = Expression.createADTo(2, 1);
        return ShortcutExpression;
    })();
    LambadaRuntimeMinimal.ShortcutExpression = ShortcutExpression;
    ExpressionBase.init();
    var Runtime = (function (_super) {
        __extends(Runtime, _super);
        function Runtime() {
            var _this = this;
            _super.call(this, 1, function (stack) {
                var result = _this.defs[stack.pop().asString()];
                if (result)
                    stack.push(Expression.createADTo(2, 0, function () { return result; }));
                else
                    stack.push(Runtime.maybeNothing);
            });
            this.defs = {};
            var def = function (name, expr) {
                _this.defs[name] = new AliasExpression(name, expr);
            };
            def("u", new BuiltinExpression(1, function (stack) {
                var x = stack.pop();
                stack.push(new BuiltinExpression(2, function (stack) {
                    var x = stack.pop();
                    stack.pop();
                    stack.push(x);
                }));
                stack.push(new BuiltinExpression(3, function (stack) {
                    var a = stack.pop();
                    var b = stack.pop();
                    var c = stack.pop();
                    stack.push(Expression.createApplication(b, c));
                    stack.push(c);
                    stack.push(a);
                }));
                stack.push(x);
            }));
            def("msgBox", new BuiltinExpression(1, function (stack) { return window.alert(stack[stack.length - 1].toString()); }));
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
                    //console.log(name + " = " + content.toString());
                    this.defs[name] = (function (content) {
                        return new AliasExpression(name, content);
                    })(content);
                }
                // end parse definition
                reader.readWhitespace();
            }
        };
        Runtime.maybeNothing = Expression.createADTo(2, 1);
        return Runtime;
    })(BuiltinExpression);
    LambadaRuntimeMinimal.Runtime = Runtime;
})(LambadaRuntimeMinimal || (LambadaRuntimeMinimal = {}));
//# sourceMappingURL=runtimeMinimal.js.map