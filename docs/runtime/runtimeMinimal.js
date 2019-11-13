var LambadaRuntimeMinimal;
(function (LambadaRuntimeMinimal) {
    class StringReader {
        constructor(str) {
            this.str = str;
            this.index = 0;
            this.len = str.length;
        }
        readWhile(pred) {
            var start = this.index;
            while (this.index < this.len && pred(this.str[this.index]))
                this.index++;
            return this.str.slice(start, this.index);
        }
        readWhitespace() {
            return this.readWhile(ch => /^\s$/.test(ch));
        }
        readNaturalNumber() {
            var num = this.readWhile(ch => /^[0-9]$/.test(ch));
            return num == "" ? null : parseInt(num);
        }
        readToken() {
            return this.readWhile(ch => /^[a-zA-Z0-9_]$/.test(ch));
        }
        readChar(expected) {
            var b = true;
            return this.readWhile(ch => {
                if (!b)
                    return false;
                b = false;
                return ch == expected;
            }).length == 1;
        }
        get charsLeft() {
            return this.len - this.index;
        }
    }
    class ExpressionBase {
        static init() {
            ExpressionBase.probeSTOP = new BuiltinExpression(undefined);
        }
        apply(stack) { return false; }
        reduce() { return false; }
        fullReduce() {
            while (this.reduce())
                ;
        }
        asNumber() {
            var n = 0;
            var probeN;
            var probeSucc = new BuiltinExpression(1, stack => {
                n++;
                stack.push(probeN);
            });
            probeN = new BuiltinExpression(1, stack => {
                var num = stack.pop();
                stack.push(probeSucc);
                stack.push(ExpressionBase.probeSTOP);
                stack.push(num);
            });
            var expr = Expression.createApplication(probeN, this);
            expr.fullReduce();
            return n;
        }
        asString() {
            var s = "";
            var probeS;
            var probeCons = new BuiltinExpression(2, stack => {
                s += String.fromCharCode(stack.pop().asNumber());
                stack.push(probeS);
            });
            probeS = new BuiltinExpression(1, stack => {
                var num = stack.pop();
                stack.push(probeCons);
                stack.push(ExpressionBase.probeSTOP);
                stack.push(num);
            });
            var expr = Expression.createApplication(probeS, this);
            expr.fullReduce();
            return s;
        }
    }
    class BuiltinExpression extends ExpressionBase {
        constructor(arity, applyTo = x => { }) {
            super();
            this.arity = arity;
            this.applyTo = applyTo;
        }
        apply(stack) {
            if (stack.length >= this.arity) {
                this.applyTo(stack);
                return true;
            }
            return false;
        }
    }
    class AliasExpression extends ExpressionBase {
        constructor(alias, slave) {
            super();
            this.alias = alias;
            this.slave = slave;
            this.called = 0;
        }
        apply(stack) { this.called++; return this.slave.apply(stack); }
        reduce() { return this.slave.reduce(); }
        fullReduce() { this.slave.fullReduce(); }
        toString() {
            return this.alias;
        }
    }
    class Expression extends ExpressionBase {
        constructor() {
            super();
            this.stack = [];
        }
        static createADTo(arity, index, ...args) {
            return new BuiltinExpression(arity, stack => {
                var head = stack[stack.length - index - 1];
                for (var i = 0; i < arity; i++)
                    stack.pop();
                for (var i = args.length - 1; i >= 0; i--)
                    stack.push(args[i]());
                stack.push(head);
            });
        }
        static createApplication(a, b) {
            var e = new Expression();
            e.stack.push(b);
            e.stack.push(a);
            return e;
        }
        static createApplicationx(...expressions) {
            var e = new Expression();
            Array.prototype.push.apply(e.stack, expressions);
            e.stack.reverse();
            return e;
        }
        apply(stack) {
            Array.prototype.push.apply(stack, this.stack);
            return true;
        }
        reduce() {
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
        }
        get top() {
            return this.stack[this.stack.length - 1];
        }
        toString() {
            var res = "";
            this.stack.forEach((x, i) => res = (i == this.stack.length - 1 ? x.toString() : "(" + x.toString() + ")") + " " + res);
            return res.trim();
        }
    }
    LambadaRuntimeMinimal.Expression = Expression;
    class ShortcutExpression {
        static createNumber(n) {
            var se = n == 0
                ? ShortcutExpression.ADTo_2_0
                : Expression.createADTo(2, 1, () => ShortcutExpression.createNumber(n - 1));
            se._asNumber = se.asNumber = () => n;
            se.toString = () => n.toString();
            return se;
        }
        static createString2(s, offset) {
            var se = s.length == offset
                ? ShortcutExpression.ADTo_2_0
                : Expression.createADTo(2, 1, () => ShortcutExpression.createNumber(s.charCodeAt(offset)), () => ShortcutExpression.createString2(s, offset + 1));
            se._asString = se.asString = () => s.slice(offset);
            se.toString = () => "\"" + s.slice(offset) + "\"";
            return se;
        }
        static createString(s) {
            return ShortcutExpression.createString2(s, 0);
        }
        static createBoolean(b) {
            return b ? ShortcutExpression.ADTo_2_0 : ShortcutExpression.ADTo_2_1;
        }
    }
    ShortcutExpression.ADTo_2_0 = Expression.createADTo(2, 0);
    ShortcutExpression.ADTo_2_1 = Expression.createADTo(2, 1);
    LambadaRuntimeMinimal.ShortcutExpression = ShortcutExpression;
    ExpressionBase.init();
    class Runtime extends BuiltinExpression {
        constructor() {
            super(1, stack => {
                var result = this.defs[stack.pop().asString()];
                if (result)
                    stack.push(Expression.createADTo(2, 0, () => result));
                else
                    stack.push(Runtime.maybeNothing);
            });
            this.defs = {};
            var def = (name, expr) => {
                this.defs[name] = new AliasExpression(name, expr);
            };
            def("u", new BuiltinExpression(1, stack => {
                var x = stack.pop();
                stack.push(new BuiltinExpression(2, stack => {
                    var x = stack.pop();
                    stack.pop();
                    stack.push(x);
                }));
                stack.push(new BuiltinExpression(3, stack => {
                    var a = stack.pop();
                    var b = stack.pop();
                    var c = stack.pop();
                    stack.push(Expression.createApplication(b, c));
                    stack.push(c);
                    stack.push(a);
                }));
                stack.push(x);
            }));
            def("msgBox", new BuiltinExpression(1, stack => window.alert(stack[stack.length - 1].toString())));
        }
        static create(binary) {
            var rt = new Runtime();
            rt.define(binary);
            return rt;
        }
        define(binaryDefinition) {
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
                        var s = reader.readWhile(ch => ch != "\"");
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
        }
    }
    Runtime.maybeNothing = Expression.createADTo(2, 1);
    LambadaRuntimeMinimal.Runtime = Runtime;
})(LambadaRuntimeMinimal || (LambadaRuntimeMinimal = {}));
