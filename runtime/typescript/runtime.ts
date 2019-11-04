module LambadaRuntime {

    type AgtReflect = { arity: number, index: number, args: AgtReflect[] } | null;

    const _perfAppHeartbeat: number = 1000000;
    const _perfAllocHeartbeat: number = 1000000;

    const _perfAppThresh: number = 100;
    const _perfAllocThresh: number = 50;
    const _perfBusyThresh: number = 60 * 1000;

    // TEMPS

    // 0.._perf???Heartbeat
    let _perfAppCounter: number = 0;
    let _perfAllocCounter: number = 0;

    // 0.._perf???Thresh
    let _perfAppCount: number = 0;
    let _perfAllocCount: number = 0;

    let _perfLastJob: number;

    // TOTALS
    let _perfAppCountTotal: number = 0;
    let _perfAllocCountTotal: number = 0;

    function _perfReport() {
        const timeBusy = new Date().getTime() - _perfLastJob;
        (<any>postMessage)({
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

    export function _perfReset() {
        _perfAppCountTotal += _perfAppCounter;
        _perfAllocCountTotal += _perfAllocCounter;
        _perfLastJob = new Date().getTime();
        _perfAppCount = _perfAppCounter = 0;
        _perfAllocCount = _perfAllocCounter = 0;

        _perfReport();
    }

    function _perfApp() {
        _perfAppCounter++;
        if (_perfAppCounter == _perfAppHeartbeat) {
            _perfAppCountTotal += _perfAppCounter;
            _perfAppCount++;
            _perfAppCounter = 0;

            _perfReport();

            console.warn("APP (" + _perfAppCount + "): " + (<any>self).uid || "n/a");
        }
    }
    function _perfAlloc() {
        _perfAllocCounter++;
        if (_perfAllocCounter == _perfAllocHeartbeat) {
            _perfAllocCountTotal += _perfAllocCounter;
            _perfAllocCount++;
            _perfAllocCounter = 0;

            _perfReport();

            console.warn("ALLOC (" + _perfAllocCount + "): " + (<any>self).uid || "n/a");
        }
    }

    class StringReader {
        private index: number;
        private len: number;

        public constructor(private str: string) {
            this.index = 0;
            this.len = str.length;
        }

        public readWhile(pred: (ch: string) => boolean): string {
            const start = this.index;
            while (this.index < this.len && pred(this.str[this.index]))
                this.index++;
            return this.str.slice(start, this.index);
        }

        public readWhitespace(): string {
            return this.readWhile(ch => /^\s$/.test(ch));
        }

        public readToken(): string {
            return this.readWhile(ch => /^[a-zA-Z0-9_]$/.test(ch));
        }

        public readChar(expected: string): boolean {
            let b = true;
            return this.readWhile(ch => {
                if (!b) return false;
                b = false;
                return ch == expected;
            }).length == 1;
        }

        public get charsLeft(): number {
            return this.len - this.index;
        }

        public toString() {
            return this.index + " / " + this.len;
        }
    }

    export class ExpressionBase {
        private static probeSTOP: ExpressionBase;

        public static init(): void {
            ExpressionBase.probeSTOP = new BuiltinExpression(undefined);
        }

        public apply(stack: ExpressionBase[]): boolean { return false; }
        public reduce(): boolean { return false; }

        public fullReduce(): void {
        }

        public _asNumber: (() => number) = undefined;
        public asNumber(): number {
            let n = 0;
            let probeN: ExpressionBase;
            const probeSucc = new BuiltinExpression(1, stack => {
                n++;
                stack.push(probeN);
            });
            probeN = new BuiltinExpression(1, stack => {
                const num: any = stack.pop();
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

        public _asString: (() => string) = undefined;
        public asString(): string {
            let s = "";
            let probeS: ExpressionBase;
            const probeCons = new BuiltinExpression(2, stack => {
                s += String.fromCharCode(stack.pop().asNumber());
                stack.push(probeS);
            });
            probeS = new BuiltinExpression(1, stack => {
                const num: any = stack.pop();
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

        private agtReflect(): AgtReflect {
            let result: { index: number, args: ExpressionBase[] } | null = null;
            const createRecorderProbe = (n: number) => {
                const probe = new BuiltinExpression(0, stack => {
                    result = { index: n, args: stack.slice(1).reverse() };
                    stack.push(BuiltinExpression.probeSTOP);
                });
                return probe;
            };
            let expr: ExpressionBase = this;
            let arity = 0;
            while (arity < 10) {
                expr = Expression.createApplication(expr, createRecorderProbe(arity++));
                expr.fullReduce();
                if (result !== null) break;
            }
            if (!result) return null;
            return {
                arity,
                index: result.index,
                args: result.args.map(x => x.agtReflect())
            };
        }

        public asGuess(): string {
            const reflect = this.agtReflect();
            return JSON.stringify(reflect);
        }
    }

    class BuiltinExpression extends ExpressionBase {
        public constructor(
            private arity: number,
            private applyTo: (stack: ExpressionBase[]) => void = x => { }) {
            super();
        }

        public apply(stack: ExpressionBase[]): boolean {
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
        private called: number = 0;

        public constructor(private alias: string, private slave: ExpressionBase) {
            super();
        }

        public apply(stack: ExpressionBase[]): boolean { this.called++; return this.slave.apply(stack); }
        public reduce(): boolean { return this.slave.reduce(); }
        public fullReduce(): void { this.slave.fullReduce(); }

        public toString(): string {
            // DEBUG
            //if (arguments.callee.caller == null
            //|| arguments.callee.caller.toString().indexOf("toString") == -1)
            //    return this.slave.toString();

            return this.alias;
        }
    }

    export class Expression extends ExpressionBase {
        public static createADTo(arity: number, index: number, ...args: (() => ExpressionBase)[]): ExpressionBase {
            return new BuiltinExpression(arity, stack => {
                const head: ExpressionBase = stack[stack.length - index - 1];

                for (let i = 0; i < arity; i++)
                    stack.pop();

                for (let i = args.length - 1; i >= 0; i--)
                    stack.push(args[i]());
                stack.push(head);
            });
        }

        public static createApplication(a: ExpressionBase, b: ExpressionBase): ExpressionBase {
            const e = new Expression();
            e.stack.push(b);
            e.stack.push(a);
            return e;
        }

        public static createApplicationx(...expressions: ExpressionBase[]): ExpressionBase {
            const e = new Expression();
            Array.prototype.push.apply(e.stack, expressions);
            e.stack.reverse();
            return e;
        }

        public stack: ExpressionBase[];

        public constructor() {
            super();
            this.stack = [];

            // PERF
            _perfAlloc();
        }

        public apply(stack: ExpressionBase[]): boolean {
            Array.prototype.push.apply(stack, this.stack);
            return true;
        }

        private hnf: boolean = false;

        public reduce(): boolean {
            if (this.hnf || this.stack.length == 0)
                return false;
            const exprs: Expression[] = [this];
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

        public fullReduce() {
            if (this.stack.length > 0) {
                const exprs: Expression[] = [this];
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

        public get top(): ExpressionBase {
            return this.stack[this.stack.length - 1];
        }

        public toString(): string {
            if (this.stack.length == 0)
                return "i";
            let res = "";
            this.stack.forEach((x, i) => res = (i == this.stack.length - 1 ? x.toString() : "(" + x.toString() + ")") + " " + res);
            return res.trim();
        }
    }

    export class ShortcutExpression {
        private static ADTo_2_0 = Expression.createADTo(2, 0);
        private static ADTo_2_1 = Expression.createADTo(2, 1);
        public static createNumber(n: number): ExpressionBase {
            const se: any = n == 0
                ? ShortcutExpression.ADTo_2_0
                : Expression.createADTo(2, 1, () => ShortcutExpression.createNumber(n - 1));
            se._asNumber = se.asNumber = () => n;
            se.toString = () => n.toString();
            return se;
        }
        private static createString2(s: string, offset: number): ExpressionBase {
            const se: any = s.length == offset
                ? ShortcutExpression.ADTo_2_0
                : Expression.createADTo(2, 1,
                    () => ShortcutExpression.createNumber(s.charCodeAt(offset)),
                    () => ShortcutExpression.createString2(s, offset + 1));
            se._asString = se.asString = () => s.slice(offset);
            se.toString = () => "\"" + s.slice(offset) + "\"";
            return se;
        }
        public static createString(s: string): ExpressionBase {
            return ShortcutExpression.createString2(s, 0);
        }
        public static createBoolean(b: boolean): ExpressionBase {
            return b ? ShortcutExpression.ADTo_2_0 : ShortcutExpression.ADTo_2_1;
        }
    }

    ExpressionBase.init();



    export class Runtime extends BuiltinExpression {
        private static maybeNothing = Expression.createADTo(2, 1);

        public static create(binary: string): Runtime {
            const rt = new Runtime();
            rt.define(binary, true);
            return rt;
        }

        private rodefs: { [name: string]: ExpressionBase };
        private defs: { [name: string]: ExpressionBase };

        public constructor() {
            super(1, stack => {
                const result = this.defs[stack.pop().asString()];
                if (result)
                    stack.push(Expression.createADTo(2, 0, () => result));
                else
                    stack.push(Runtime.maybeNothing);
            });

            this.defs = {};
            this.rodefs = {};

            const def = (name: string, expr: ExpressionBase, predefine: boolean = false) => {
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
                (<any>x).stack[0] = x;
                stack.push(x);
            });
            def("y", y);

            def("Zero", ShortcutExpression.createNumber(0));
            def("add", new BuiltinExpression(2,
                stack => stack.push(ShortcutExpression.createNumber(stack.pop().asNumber() + stack.pop().asNumber()))));
            def("sub", new BuiltinExpression(2,
                stack => stack.push(ShortcutExpression.createNumber(Math.max(0, stack.pop().asNumber() - stack.pop().asNumber())))));
            def("mul", new BuiltinExpression(2,
                stack => stack.push(ShortcutExpression.createNumber(stack.pop().asNumber() * stack.pop().asNumber()))));
            def("div", new BuiltinExpression(2,
                stack => stack.push(ShortcutExpression.createNumber((stack.pop().asNumber() / stack.pop().asNumber()) | 0))));

            //def("strCons", new BuiltinExpression(2,
            //    stack => stack.push(ShortcutExpression.createString(stack.pop().asString() + stack.pop().asString()))));
            def("strEquals", new BuiltinExpression(2,
                stack => stack.push(ShortcutExpression.createBoolean(stack.pop().asString() == stack.pop().asString()))));
            def("strFromN", new BuiltinExpression(1,
                stack => stack.push(ShortcutExpression.createString(stack.pop().asNumber().toString()))));
            def("strEmpty", ShortcutExpression.createString(""));

            /*def("strSkip", new BuiltinExpression(2, stack =>
            {
                const x = stack.pop().asString();
                const y = stack.pop().asNumber();
                stack.push(ShortcutExpression.createString(x.slice(y)));
            }));*/

            def("msgBox", new BuiltinExpression(1,
                stack => window.alert(stack[stack.length - 1].toString())));
        }

        public getNames(): string[] {
            return Object.keys(this.defs);
        }

        public define(binaryDefinition: string, withBuiltins: boolean): void {
            const reader = new StringReader(binaryDefinition);

            reader.readWhitespace();
            while (reader.charsLeft > 0) {
                // begin parse definition
                const name = reader.readToken();

                const expressionStack: ExpressionBase[] = [];

                while (true) {
                    reader.readWhitespace();

                    // apply
                    if (reader.readChar(".")) {
                        if (expressionStack.length < 2)
                            break;
                        const b = expressionStack.pop();
                        const a = expressionStack.pop();
                        if (a instanceof Expression) {
                            (<Expression>a).stack.unshift(b);
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
                    this.defs[name] = (function (content: ExpressionBase) {
                        return new AliasExpression(name, content);
                    })(content);
                else
                    this.defs[name] = this.rodefs[name];
                // end parse definition

                reader.readWhitespace();
            }
        }

        public getStats(cnt: number = 10): { alias: string; called: number }[] {
            let x: LambadaRuntime.ExpressionBase[] = Object.values(this.defs);
            x = x.sort((a, b) => (<any>b).called - (<any>a).called);
            return x.slice(0, cnt).map(y => { return { alias: (<any>y).alias, called: (<any>y).called }; });
        }
    }
}
