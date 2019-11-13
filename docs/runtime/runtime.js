var LambadaRuntime;
(function (LambadaRuntime) {
    const _perfAppHeartbeat = 1000000;
    const _perfAllocHeartbeat = 1000000;
    const _perfAppThresh = 100;
    const _perfAllocThresh = 50;
    const _perfBusyThresh = 60 * 1000;
    // TEMPS
    // 0.._perf???Heartbeat
    let _perfAppCounter = 0;
    let _perfAllocCounter = 0;
    // 0.._perf???Thresh
    let _perfAppCount = 0;
    let _perfAllocCount = 0;
    let _perfLastJob;
    // TOTALS
    let _perfAppCountTotal = 0;
    let _perfAllocCountTotal = 0;
    function _perfReport() {
        const timeBusy = new Date().getTime() - _perfLastJob;
        postMessage({
            "id": -1,
            "nApp": _perfAppCountTotal,
            "nAlloc": _perfAllocCountTotal,
            "timeBusy": timeBusy
        });
        if (_perfAppCount >= _perfAppThresh)
            throw "ERR_APP_THRESH: possible infinite loop";
        if (_perfAllocCount > _perfAllocThresh)
            throw "ERR_ALLOC_THRESH: possible infinite loop";
        if (timeBusy > _perfBusyThresh)
            throw "ERR_BUSY_THRESH: possible infinite loop";
    }
    function _perfReset() {
        _perfAppCountTotal += _perfAppCounter;
        _perfAllocCountTotal += _perfAllocCounter;
        _perfLastJob = new Date().getTime();
        _perfAppCount = _perfAppCounter = 0;
        _perfAllocCount = _perfAllocCounter = 0;
        _perfReport();
    }
    LambadaRuntime._perfReset = _perfReset;
    function _perfApp() {
        _perfAppCounter++;
        if (_perfAppCounter == _perfAppHeartbeat) {
            _perfAppCountTotal += _perfAppCounter;
            _perfAppCount++;
            _perfAppCounter = 0;
            _perfReport();
            console.warn("APP (" + _perfAppCount + "): " + self.uid || "n/a");
        }
    }
    function _perfAlloc() {
        _perfAllocCounter++;
        if (_perfAllocCounter == _perfAllocHeartbeat) {
            _perfAllocCountTotal += _perfAllocCounter;
            _perfAllocCount++;
            _perfAllocCounter = 0;
            _perfReport();
            console.warn("ALLOC (" + _perfAllocCount + "): " + self.uid || "n/a");
        }
    }
    class StringReader {
        constructor(str) {
            this.str = str;
            this.index = 0;
            this.len = str.length;
        }
        readWhile(pred) {
            const start = this.index;
            while (this.index < this.len && pred(this.str[this.index]))
                this.index++;
            return this.str.slice(start, this.index);
        }
        readWhitespace() {
            return this.readWhile(ch => /^\s$/.test(ch));
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
        toString() {
            return this.index + " / " + this.len;
        }
    }
    class ExpressionBase {
        constructor() {
            this._asNumber = undefined;
            this._asString = undefined;
        }
        static init() {
            ExpressionBase.probeSTOP = new BuiltinExpression(undefined);
        }
        apply(stack) { return false; }
        reduce() { return false; }
        fullReduce() {
        }
        asNumber() {
            let n = 0n;
            let probeN;
            const probeSucc = new BuiltinExpression(1, stack => {
                n++;
                stack.push(probeN);
            });
            probeN = new BuiltinExpression(1, stack => {
                const num = stack.pop();
                if (num._asNumber) {
                    n += num._asNumber();
                    return;
                }
                stack.push(probeSucc);
                stack.push(ExpressionBase.probeSTOP);
                stack.push(num);
            });
            const expr = Expression.createApplication(probeN, this);
            expr.fullReduce();
            this._asNumber = this.asNumber = () => n;
            return n;
        }
        asString() {
            let s = "";
            let probeS;
            const probeCons = new BuiltinExpression(2, stack => {
                s += String.fromCharCode(Number(stack.pop().asNumber()));
                stack.push(probeS);
            });
            probeS = new BuiltinExpression(1, stack => {
                const num = stack.pop();
                if (num._asString) {
                    s += num._asString();
                    return;
                }
                stack.push(probeCons);
                stack.push(ExpressionBase.probeSTOP);
                stack.push(num);
            });
            const expr = Expression.createApplication(probeS, this);
            expr.fullReduce();
            this._asString = this.asString = () => s;
            return s;
        }
        agtReflect(recursion = 8) {
            if (recursion <= 0)
                return undefined;
            let result = null;
            const createRecorderProbe = (n) => {
                const probe = new BuiltinExpression(1, stack => {
                    result = result || { index: n, args: [] };
                    result.args.push(...stack.slice().reverse());
                    stack.push(probe);
                });
                return probe;
            };
            let expr = this;
            let arity = 0;
            while (arity < 10) {
                expr = Expression.createApplication(expr, createRecorderProbe(arity++));
                expr.fullReduce();
                if (result !== null)
                    break;
            }
            if (!result)
                return null;
            return {
                hint: null,
                // hint: JSON.stringify(this),
                arity,
                index: result.index,
                args: result.args.map(x => x.agtReflect(recursion - 1))
            };
        }
        static validate(agt, reflect) {
            if (reflect === undefined)
                return true;
            if (reflect === null)
                return false;
            if (agt.ctors.length !== reflect.arity)
                return false;
            if (agt.ctors[reflect.index].length !== reflect.args.length)
                return false;
            return agt.ctors[reflect.index].every((farg, i) => this.validate(farg, reflect.args[i]));
        }
        static agtBool() {
            return { ctors: [[], []] };
        }
        // private static agtMaybe(): Agt {
        //     return { ctors: [[], []] };
        // }
        static agtNat() {
            const result = { ctors: [[], []] };
            result.ctors[1].push(result);
            return result;
        }
        static agtList(elem) {
            const result = { ctors: [[], [elem]] };
            result.ctors[1].push(result);
            return result;
        }
        static agtString() {
            return this.agtList(this.agtNat());
        }
        static agtPair(a, b) {
            return { ctors: [[a, b]] };
        }
        asGuess() {
            const reflect = this.agtReflect();
            const result = [];
            if (ExpressionBase.validate(ExpressionBase.agtBool(), reflect))
                result.push({ type: 'Bool', value: reflect.index === 0 });
            if (ExpressionBase.validate(ExpressionBase.agtNat(), reflect))
                result.push({ type: 'Nat', value: this.asNumber() });
            if (ExpressionBase.validate(ExpressionBase.agtString(), reflect))
                result.push({ type: 'string', value: this.asString() });
            if (result.length === 0)
                return "No known interpretation for result!";
            if (result.length === 1)
                return result[0].value;
            return result.map(x => `${x.value} :: ${x.type}`).join('\n');
        }
    }
    LambadaRuntime.ExpressionBase = ExpressionBase;
    class BuiltinExpression extends ExpressionBase {
        constructor(arity, applyTo = x => { }) {
            super();
            this.arity = arity;
            this.applyTo = applyTo;
        }
        apply(stack) {
            // PERF
            _perfApp();
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
            // DEBUG
            //if (arguments.callee.caller == null
            //|| arguments.callee.caller.toString().indexOf("toString") == -1)
            //    return this.slave.toString();
            return this.alias;
        }
    }
    class Expression extends ExpressionBase {
        constructor() {
            super();
            this.hnf = false;
            this.stack = [];
            // PERF
            _perfAlloc();
        }
        static createADTo(arity, index, ...args) {
            return new BuiltinExpression(arity, stack => {
                const head = stack[stack.length - index - 1];
                for (let i = 0; i < arity; i++)
                    stack.pop();
                for (let i = args.length - 1; i >= 0; i--)
                    stack.push(args[i]());
                stack.push(head);
            });
        }
        static createApplication(a, b) {
            const e = new Expression();
            e.stack.push(b);
            e.stack.push(a);
            return e;
        }
        static createApplicationx(...expressions) {
            const e = new Expression();
            Array.prototype.push.apply(e.stack, expressions);
            e.stack.reverse();
            return e;
        }
        apply(stack) {
            Array.prototype.push.apply(stack, this.stack);
            return true;
        }
        reduce() {
            if (this.hnf || this.stack.length == 0)
                return false;
            const exprs = [this];
            while (true) {
                const top = exprs[exprs.length - 1].top;
                if (top instanceof Expression && top.stack.length > 0)
                    exprs.push(top);
                else
                    break;
            }
            while (exprs.length > 0) {
                const stack = exprs.pop().stack;
                const top = stack.pop();
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
        }
        fullReduce() {
            if (this.stack.length > 0) {
                const exprs = [this];
                while (exprs.length > 0) {
                    while (true) {
                        const top = exprs[exprs.length - 1].top;
                        if (top instanceof Expression && top.stack.length > 0)
                            exprs.push(top);
                        else
                            break;
                    }
                    do {
                        const expr = exprs.pop();
                        if (expr.stack.length == 0)
                            continue;
                        const top = expr.stack.pop();
                        top.fullReduce();
                        if (top.apply(expr.stack)) {
                            exprs.push(expr);
                            break;
                        }
                        expr.stack.push(top);
                    } while (exprs.length > 0);
                }
            }
        }
        get top() {
            return this.stack[this.stack.length - 1];
        }
        toString() {
            if (this.stack.length == 0)
                return "i";
            let res = "";
            this.stack.forEach((x, i) => res = (i == this.stack.length - 1 ? x.toString() : "(" + x.toString() + ")") + " " + res);
            return res.trim();
        }
    }
    LambadaRuntime.Expression = Expression;
    class ShortcutExpression {
        static createNumber(n) {
            const se = n === 0n
                ? ShortcutExpression.ADTo_2_0
                : Expression.createADTo(2, 1, () => ShortcutExpression.createNumber(n - 1n));
            se._asNumber = se.asNumber = () => n;
            se.toString = () => n.toString();
            return se;
        }
        static createString2(s, offset) {
            const se = s.length == offset
                ? ShortcutExpression.ADTo_2_0
                : Expression.createADTo(2, 1, () => ShortcutExpression.createNumber(BigInt(s.charCodeAt(offset))), () => ShortcutExpression.createString2(s, offset + 1));
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
    LambadaRuntime.ShortcutExpression = ShortcutExpression;
    ExpressionBase.init();
    class Runtime extends BuiltinExpression {
        constructor() {
            super(1, stack => {
                const result = this.defs[stack.pop().asString()];
                if (result)
                    stack.push(Expression.createADTo(2, 0, () => result));
                else
                    stack.push(Runtime.maybeNothing);
            });
            this.defs = {};
            this.rodefs = {};
            const def = (name, expr, predefine = false) => {
                this.rodefs[name] = new AliasExpression(name, expr);
                if (predefine)
                    this.defs[name] = this.rodefs[name];
            };
            def("u", new BuiltinExpression(1, stack => {
                const x = stack.pop();
                stack.push(new BuiltinExpression(2, stack => {
                    const x = stack.pop();
                    stack.pop();
                    stack.push(x);
                }));
                stack.push(new BuiltinExpression(3, stack => {
                    const a = stack.pop();
                    const b = stack.pop();
                    const c = stack.pop();
                    stack.push(Expression.createApplication(b, c));
                    stack.push(c);
                    stack.push(a);
                }));
                stack.push(x);
            }), true);
            def("i", new BuiltinExpression(0));
            def("k", new BuiltinExpression(2, stack => {
                const x = stack.pop();
                stack.pop();
                stack.push(x);
            }));
            def("s", new BuiltinExpression(3, stack => {
                const a = stack.pop();
                const b = stack.pop();
                const c = stack.pop();
                stack.push(Expression.createApplication(b, c), c, a);
            }));
            def("b", new BuiltinExpression(3, stack => {
                const a = stack.pop();
                const b = stack.pop();
                const c = stack.pop();
                stack.push(Expression.createApplication(b, c), a);
            }));
            def("c", new BuiltinExpression(3, stack => {
                const a = stack.pop();
                const b = stack.pop();
                const c = stack.pop();
                stack.push(b, c, a);
            }));
            let y = new BuiltinExpression(1, stack => {
                const x = stack.pop();
                stack.push(Expression.createApplication(y, x), x);
            });
            // WARNING: this impl. makes state-serialization hard
            y = new BuiltinExpression(1, stack => {
                let x = stack.pop();
                x = Expression.createApplication(x, x);
                x.stack[0] = x;
                stack.push(x);
            });
            def("y", y);
            def("Zero", ShortcutExpression.createNumber(0n));
            def("add", new BuiltinExpression(2, stack => stack.push(ShortcutExpression.createNumber(stack.pop().asNumber() + stack.pop().asNumber()))));
            def("sub", new BuiltinExpression(2, stack => {
                const res = stack.pop().asNumber() - stack.pop().asNumber();
                return stack.push(ShortcutExpression.createNumber(res < 0n ? 0n : res));
            }));
            def("mul", new BuiltinExpression(2, stack => stack.push(ShortcutExpression.createNumber(stack.pop().asNumber() * stack.pop().asNumber()))));
            def("div", new BuiltinExpression(2, stack => stack.push(ShortcutExpression.createNumber(stack.pop().asNumber() / stack.pop().asNumber()))));
            //def("strCons", new BuiltinExpression(2,
            //    stack => stack.push(ShortcutExpression.createString(stack.pop().asString() + stack.pop().asString()))));
            def("strEquals", new BuiltinExpression(2, stack => stack.push(ShortcutExpression.createBoolean(stack.pop().asString() == stack.pop().asString()))));
            def("strFromN", new BuiltinExpression(1, stack => stack.push(ShortcutExpression.createString(stack.pop().asNumber().toString()))));
            def("strEmpty", ShortcutExpression.createString(""));
            /*def("strSkip", new BuiltinExpression(2, stack =>
            {
                const x = stack.pop().asString();
                const y = stack.pop().asNumber();
                stack.push(ShortcutExpression.createString(x.slice(y)));
            }));*/
            def("msgBox", new BuiltinExpression(1, stack => window.alert(stack[stack.length - 1].toString())));
        }
        static create(binary) {
            const rt = new Runtime();
            rt.define(binary, true);
            return rt;
        }
        getNames() {
            return Object.keys(this.defs);
        }
        define(binaryDefinition, withBuiltins) {
            const reader = new StringReader(binaryDefinition);
            reader.readWhitespace();
            while (reader.charsLeft > 0) {
                // begin parse definition
                const name = reader.readToken();
                const expressionStack = [];
                while (true) {
                    reader.readWhitespace();
                    // apply
                    if (reader.readChar(".")) {
                        if (expressionStack.length < 2)
                            break;
                        const b = expressionStack.pop();
                        const a = expressionStack.pop();
                        if (a instanceof Expression) {
                            a.stack.unshift(b);
                            expressionStack.push(a);
                        }
                        else {
                            expressionStack.push(Expression.createApplication(a, b));
                        }
                        continue;
                    }
                    // defref
                    const defRef = reader.readToken();
                    const def = this.defs[defRef];
                    if (def == undefined)
                        throw "unresolved reference: " + defRef;
                    expressionStack.push(def);
                }
                const content = expressionStack.pop();
                //console.log(name + " = " + content.toString());
                if (this.rodefs[name] == undefined || !withBuiltins)
                    this.defs[name] = (function (content) {
                        return new AliasExpression(name, content);
                    })(content);
                else
                    this.defs[name] = this.rodefs[name];
                // end parse definition
                reader.readWhitespace();
            }
        }
        getStats(cnt = 10) {
            let x = Object.values(this.defs);
            x = x.sort((a, b) => b.called - a.called);
            return x.slice(0, cnt).map(y => { return { alias: y.alias, called: y.called }; });
        }
    }
    Runtime.maybeNothing = Expression.createADTo(2, 1);
    LambadaRuntime.Runtime = Runtime;
})(LambadaRuntime || (LambadaRuntime = {}));
