"use strict";
var LambadaRuntimeMinimal;
(function (LambadaRuntimeMinimal) {
    class StringReader {
        constructor(str) {
            this.str = str;
            this.index = 0;
            this.len = str.length;
        }
        readWhile(pred) {
            let start = this.index;
            while (this.index < this.len && pred(this.str[this.index]))
                this.index++;
            return this.str.slice(start, this.index);
        }
        readWhitespace() {
            return this.readWhile(ch => /^\s$/.test(ch));
        }
        readNaturalNumber() {
            let num = this.readWhile(ch => /^[0-9]$/.test(ch));
            return num == "" ? null : parseInt(num);
        }
        readToken() {
            return this.readWhile(ch => /^[a-zA-Z0-9_]$/.test(ch));
        }
        readChar(expected) {
            let b = true;
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
            let n = 0;
            let probeN;
            let probeSucc = new BuiltinExpression(1, stack => {
                n++;
                stack.push(probeN);
            });
            probeN = new BuiltinExpression(1, stack => {
                let num = stack.pop();
                stack.push(probeSucc);
                stack.push(ExpressionBase.probeSTOP);
                stack.push(num);
            });
            let expr = Expression.createApplication(probeN, this);
            expr.fullReduce();
            return n;
        }
        asString() {
            let s = "";
            let probeS;
            let probeCons = new BuiltinExpression(2, stack => {
                s += String.fromCharCode(stack.pop().asNumber());
                stack.push(probeS);
            });
            probeS = new BuiltinExpression(1, stack => {
                let num = stack.pop();
                stack.push(probeCons);
                stack.push(ExpressionBase.probeSTOP);
                stack.push(num);
            });
            let expr = Expression.createApplication(probeS, this);
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
            if (stack.length >= (this.arity || 0)) {
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
                let head = stack[stack.length - index - 1];
                for (let i = 0; i < arity; i++)
                    stack.pop();
                for (let i = args.length - 1; i >= 0; i--)
                    stack.push(args[i]());
                stack.push(head);
            });
        }
        static createApplication(a, b) {
            let e = new Expression();
            e.stack.push(b);
            e.stack.push(a);
            return e;
        }
        static createApplicationx(...expressions) {
            let e = new Expression();
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
            let exprs = [this];
            while (true) {
                let top = exprs[exprs.length - 1].top;
                if (top instanceof Expression && top.stack.length > 0)
                    exprs.push(top);
                else
                    break;
            }
            while (exprs.length > 0) {
                let stack = exprs.pop().stack;
                let top = stack.pop();
                if (top && top.reduce()) {
                    stack.push(top);
                    return true;
                }
                else if (top && !top.apply(stack))
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
            let res = "";
            this.stack.forEach((x, i) => res = (i == this.stack.length - 1 ? x.toString() : "(" + x.toString() + ")") + " " + res);
            return res.trim();
        }
    }
    LambadaRuntimeMinimal.Expression = Expression;
    class ShortcutExpression {
        static createNumber(n) {
            let se = n == 0
                ? ShortcutExpression.ADTo_2_0
                : Expression.createADTo(2, 1, () => ShortcutExpression.createNumber(n - 1));
            se._asNumber = se.asNumber = () => n;
            se.toString = () => n.toString();
            return se;
        }
        static createString2(s, offset) {
            let se = s.length == offset
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
                let result = this.defs[stack.pop().asString()];
                if (result)
                    stack.push(Expression.createADTo(2, 0, () => result));
                else
                    stack.push(Runtime.maybeNothing);
            });
            this.defs = {};
            let def = (name, expr) => {
                this.defs[name] = new AliasExpression(name, expr);
            };
            def("u", new BuiltinExpression(1, stack => {
                let x = stack.pop();
                if (!x)
                    throw 'debug me';
                stack.push(new BuiltinExpression(2, stack => {
                    let x = stack.pop();
                    if (!x)
                        throw 'debug me';
                    stack.pop();
                    stack.push(x);
                }));
                stack.push(new BuiltinExpression(3, stack => {
                    let a = stack.pop();
                    let b = stack.pop();
                    let c = stack.pop();
                    if (!a)
                        throw 'debug me';
                    if (!b)
                        throw 'debug me';
                    if (!c)
                        throw 'debug me';
                    stack.push(Expression.createApplication(b, c));
                    stack.push(c);
                    stack.push(a);
                }));
                stack.push(x);
            }));
            def("msgBox", new BuiltinExpression(1, stack => window.alert(stack[stack.length - 1].toString())));
        }
        static create(binary) {
            let rt = new Runtime();
            rt.define(binary);
            return rt;
        }
        define(binaryDefinition) {
            let reader = new StringReader(binaryDefinition);
            reader.readWhitespace();
            while (reader.charsLeft > 0) {
                // begin parse definition
                let name = reader.readToken();
                let expressionStack = [];
                while (true) {
                    reader.readWhitespace();
                    // apply
                    if (reader.readChar(".")) {
                        if (expressionStack.length < 2)
                            break;
                        let b = expressionStack.pop();
                        let a = expressionStack.pop();
                        if (!a)
                            throw 'debug me';
                        if (!b)
                            throw 'debug me';
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
                    let num = reader.readNaturalNumber();
                    if (num != null) {
                        expressionStack.push(ShortcutExpression.createNumber(num));
                        continue;
                    }
                    // string
                    if (reader.readChar("\"")) {
                        let s = reader.readWhile(ch => ch != "\"");
                        reader.readChar("\"");
                        expressionStack.push(ShortcutExpression.createString(s));
                        continue;
                    }
                    // defref
                    let defRef = reader.readToken();
                    let def = this.defs[defRef];
                    if (def == undefined)
                        throw "undefined reference: " + defRef;
                    expressionStack.push(def);
                }
                if (this.defs[name] == undefined) {
                    let content = expressionStack.pop();
                    if (!content)
                        throw 'debug me';
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
