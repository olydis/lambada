module LambadaRuntime
{
    var _perfAppCountX: number = 0;
    var _perfAppCount: number = 0;
    var _perfAllocCountX: number = 0;
    var _perfAllocCount: number = 0;

    export function _perfReset()
    {
        _perfAppCountX = _perfAppCount = 0;
        _perfAllocCountX = _perfAllocCount = 0;
    }

    function _perfApp()
    {
        _perfAppCount++;
        if (_perfAppCount == 1000000 * 10)
        {
            _perfAppCount = 0;
            _perfAppCountX++;
            _perfCheck();
            console.warn("APP (" + _perfAppCountX + "): " + (<any>self).uid || "n/a");
        }
    }
    function _perfAlloc()
    {
        _perfAllocCount++;
        if (_perfAllocCount == 1000000)
        {
            _perfAllocCount = 0;
            _perfAllocCountX++;
            _perfCheck();
            console.warn("ALLOC (" + _perfAllocCountX + "): " + (<any>self).uid || "n/a");
        }
    }

    function _perfCheck()
    {
        if (_perfAppCountX > 10)
            throw "ERR_APP_THRESH: possible infinite loop";
        if (_perfAllocCountX > 5)
            throw "ERR_ALLOC_THRESH: possible infinite loop";
    }

    class StringReader
    {
        private index: number;
        private len: number;

        public constructor(private str: string)
        {
            this.index = 0;
            this.len = str.length;
        }

        public readWhile(pred: (ch: string) => boolean): string
        {
            var start = this.index;
            while (this.index < this.len && pred(this.str[this.index]))
                this.index++;
            return this.str.slice(start, this.index);
        }

        public readWhitespace(): string
        {
            return this.readWhile(ch => /^\s$/.test(ch));
        }

        public readToken(): string
        {
            return this.readWhile(ch => /^[a-zA-Z0-9_]$/.test(ch));
        }

        public readChar(expected: string): boolean
        {
            var b = true;
            return this.readWhile(ch =>
            {
                if (!b) return false;
                b = false;
                return ch == expected;
            }).length == 1;
        }

        public get charsLeft(): number
        {
            return this.len - this.index;
        }

        public toString()
        {
            return this.index + " / " + this.len;
        }
    }

    export class ExpressionBase
    {
        private static probeSTOP: ExpressionBase;

        public static init(): void
        {
            ExpressionBase.probeSTOP = new BuiltinExpression(undefined);
        }

        public apply(stack: ExpressionBase[]): boolean { return false; }
        public reduce(): boolean { return false; }

        public fullReduce(): void
        {
        }

        public _asNumber: (() => number) = undefined;
        public asNumber(): number
        {
            var n = 0;
            var probeN: ExpressionBase;
            var probeSucc = new BuiltinExpression(1, stack =>
            {
                n++;
                stack.push(probeN);
            });
            probeN = new BuiltinExpression(1, stack => 
            {
                var num: any = stack.pop();
                if (num._asNumber)
                {
                    n += num._asNumber();
                    return;
                }
                stack.push(probeSucc);
                stack.push(ExpressionBase.probeSTOP);
                stack.push(num);
            });

            var expr = Expression.createApplication(probeN, this);
            expr.fullReduce();

            this._asNumber = this.asNumber = () => n;

            return n;
        }

        public _asString: (() => string) = undefined;
        public asString(): string
        {
            var s = "";
            var probeS: ExpressionBase;
            var probeCons = new BuiltinExpression(2, stack =>
            {
                s += String.fromCharCode(stack.pop().asNumber());
                stack.push(probeS);
            });
            probeS = new BuiltinExpression(1, stack => 
            {
                var num: any = stack.pop();
                if (num._asString)
                {
                    s += num._asString();
                    return;
                }
                stack.push(probeCons);
                stack.push(ExpressionBase.probeSTOP);
                stack.push(num);
            });

            var expr = Expression.createApplication(probeS, this);
            expr.fullReduce();

            this._asString = this.asString = () => s;

            return s;
        }
    }

    class BuiltinExpression extends ExpressionBase
    {
        public constructor(
            private arity: number,
            private applyTo: (stack: ExpressionBase[]) => void = x => { })
        {
            super();
        }

        public apply(stack: ExpressionBase[]): boolean
        {
            // PERF
            _perfApp();

            if (stack.length >= this.arity)
            {
                this.applyTo(stack);
                return true;
            }
            return false;
        }
    }

    class AliasExpression extends ExpressionBase
    {
        private called: number = 0;

        public constructor(private alias: string, private slave: ExpressionBase)
        {
            super();
        }

        public apply(stack: ExpressionBase[]): boolean { this.called++; return this.slave.apply(stack); }
        public reduce(): boolean { return this.slave.reduce(); }
        public fullReduce(): void { this.slave.fullReduce(); }

        public toString(): string
        {
            // DEBUG
            //if (arguments.callee.caller == null 
            //|| arguments.callee.caller.toString().indexOf("toString") == -1)
            //    return this.slave.toString();
        
            return this.alias;
        }
    }

    export class Expression extends ExpressionBase
    {
        public static createADTo(arity: number, index: number, ...args: (() => ExpressionBase)[]): ExpressionBase
        {
            return new BuiltinExpression(arity, stack =>
            {
                var head: ExpressionBase = stack[stack.length - index - 1];

                for (var i = 0; i < arity; i++)
                    stack.pop();

                for (var i = args.length - 1; i >= 0; i--)
                    stack.push(args[i]());
                stack.push(head);
            });
        }

        public static createApplication(a: ExpressionBase, b: ExpressionBase): ExpressionBase
        {
            var e = new Expression();
            e.stack.push(b);
            e.stack.push(a);
            return e;
        }

        public static createApplicationx(...expressions: ExpressionBase[]): ExpressionBase
        {
            var e = new Expression();
            Array.prototype.push.apply(e.stack, expressions);
            e.stack.reverse();
            return e;
        }

        public stack: ExpressionBase[];

        public constructor()
        {
            super();
            this.stack = [];

            // PERF
            _perfAlloc();
        }

        public apply(stack: ExpressionBase[]): boolean
        {
            Array.prototype.push.apply(stack, this.stack);
            return true;
        }

        private hnf: boolean = false;

        public reduce(): boolean
        {
            if (this.hnf || this.stack.length == 0)
                return false;
            var exprs = [this];
            while (true)
            {
                var top = exprs[exprs.length - 1].top;
                if (top instanceof Expression && top.stack.length > 0)
                    exprs.push(top);
                else
                    break;
            }
            while (exprs.length > 0)
            {
                var stack = exprs.pop().stack;
                var top = stack.pop();

                if (top.reduce())
                {
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

        public fullReduce()
        {
            if (this.stack.length > 0)
            {
                var exprs = [this];
                while (exprs.length > 0)
                {
                    while (true)
                    {
                        var top = exprs[exprs.length - 1].top;
                        if (top instanceof Expression && top.stack.length > 0)
                            exprs.push(top);
                        else
                            break;
                    }

                    do
                    {
                        var expr = exprs.pop();
                        if (expr.stack.length == 0)
                            continue;
                        var top = expr.stack.pop();
                        top.fullReduce();
                        if (top.apply(expr.stack))
                        {
                            exprs.push(expr);
                            break;
                        }
                        expr.stack.push(top);
                    } while (exprs.length > 0);
                }
            }
        }

        public get top(): ExpressionBase
        {
            return this.stack[this.stack.length - 1];
        }

        public toString(): string
        {
            if (this.stack.length == 0)
                return "i";
            var res = "";
            this.stack.forEach((x, i) => res = (i == this.stack.length - 1 ? x.toString() : "(" + x.toString() + ")") + " " + res);
            return res.trim();
        }
    }

    export class ShortcutExpression
    {
        private static ADTo_2_0 = Expression.createADTo(2, 0);
        private static ADTo_2_1 = Expression.createADTo(2, 1);
        public static createNumber(n: number): ExpressionBase
        {
            var se: any = n == 0
                ? ShortcutExpression.ADTo_2_0
                : Expression.createADTo(2, 1,() => ShortcutExpression.createNumber(n - 1));
            se._asNumber = se.asNumber = () => n;
            se.toString = () => n.toString();
            return se;
        }
        private static createString2(s: string, offset: number): ExpressionBase
        {
            var se: any = s.length == offset
                ? ShortcutExpression.ADTo_2_0
                : Expression.createADTo(2, 1,
                    () => ShortcutExpression.createNumber(s.charCodeAt(offset)),
                    () => ShortcutExpression.createString2(s, offset + 1));
            se._asString = se.asString = () => s.slice(offset);
            se.toString = () => "\"" + s.slice(offset) + "\"";
            return se;
        }
        public static createString(s: string): ExpressionBase
        {
            return ShortcutExpression.createString2(s, 0);
        }
        public static createBoolean(b: boolean): ExpressionBase
        {
            return b ? ShortcutExpression.ADTo_2_0 : ShortcutExpression.ADTo_2_1;
        }
    }

    ExpressionBase.init();



    export class Runtime extends BuiltinExpression
    {
        private static maybeNothing = Expression.createADTo(2, 1);

        public static create(binary: string): Runtime
        {
            var rt = new Runtime();
            rt.define(binary);
            return rt;
        }

        private rodefs: { [name: string]: ExpressionBase };
        private defs: { [name: string]: ExpressionBase };

        public constructor()
        {
            super(1, stack => 
            {
                var result = this.defs[stack.pop().asString()];
                if (result)
                    stack.push(Expression.createADTo(2, 0,() => result));
                else
                    stack.push(Runtime.maybeNothing);
            });

            this.defs = {};
            this.rodefs = {};

            var def = (name: string, expr: ExpressionBase, predefine: boolean = false) =>
            {
                this.rodefs[name] = new AliasExpression(name, expr);
                if (predefine)
                    this.defs[name] = this.rodefs[name];
            };

            def("u", new BuiltinExpression(1, stack =>
            {
                var x = stack.pop();
                stack.push(new BuiltinExpression(2, stack =>
                {
                    var x = stack.pop();
                    stack.pop();
                    stack.push(x);
                }));
                stack.push(new BuiltinExpression(3, stack =>
                {
                    var a = stack.pop();
                    var b = stack.pop();
                    var c = stack.pop();
                    stack.push(Expression.createApplication(b, c));
                    stack.push(c);
                    stack.push(a);
                }));
                stack.push(x);
            }), true);

            def("i", new BuiltinExpression(0));
            def("k", new BuiltinExpression(2, stack =>
            {
                var x = stack.pop();
                stack.pop();
                stack.push(x);
            }));
            def("s", new BuiltinExpression(3, stack =>
            {
                var a = stack.pop();
                var b = stack.pop();
                var c = stack.pop();
                stack.push(Expression.createApplication(b, c));
                stack.push(c);
                stack.push(a);
            }));
            def("b", new BuiltinExpression(3, stack =>
            {
                var a = stack.pop();
                var b = stack.pop();
                var c = stack.pop();
                stack.push(Expression.createApplication(b, c));
                stack.push(a);
            }));
            def("c", new BuiltinExpression(3, stack =>
            {
                var a = stack.pop();
                var b = stack.pop();
                var c = stack.pop();
                stack.push(b);
                stack.push(c);
                stack.push(a);
            }));

            def("Zero", ShortcutExpression.createNumber(0));
            def("add", new BuiltinExpression(2, 
                stack => stack.push(ShortcutExpression.createNumber(stack.pop().asNumber() + stack.pop().asNumber()))));
            def("sub", new BuiltinExpression(2,
                stack => stack.push(ShortcutExpression.createNumber(Math.max(0, stack.pop().asNumber() - stack.pop().asNumber())))));
            def("mul", new BuiltinExpression(2,
                stack => stack.push(ShortcutExpression.createNumber(stack.pop().asNumber() * stack.pop().asNumber()))));
            def("div", new BuiltinExpression(2,
                stack => stack.push(ShortcutExpression.createNumber((stack.pop().asNumber() / stack.pop().asNumber()) | 0))));

            def("strCons", new BuiltinExpression(2,
                stack => stack.push(ShortcutExpression.createString(stack.pop().asString() + stack.pop().asString()))));
            def("strEquals", new BuiltinExpression(2,
                stack => stack.push(ShortcutExpression.createBoolean(stack.pop().asString() == stack.pop().asString()))));
            def("strFromN", new BuiltinExpression(1, 
                stack => stack.push(ShortcutExpression.createString(stack.pop().asNumber().toString()))));
            def("strEmpty", ShortcutExpression.createString(""));

            //def("strSkip", new BuiltinExpression(stack => stack.length >= 2, stack =>
            //{
            //    var x = stack.pop().asString();
            //    var y = stack.pop().asNumber();
            //    stack.push(ShortcutExpression.createString(x.slice(y)));
            //}));

            def("msgBox", new BuiltinExpression(1,
                stack => window.alert(stack[stack.length - 1].toString())));
        }

        public getNames(): string[]
        {
            var names: string[] = [];
            for (name in this.defs)
                names.push(name);
            return names;
        }

        public define(binaryDefinition: string): void
        {
            var reader = new StringReader(binaryDefinition);

            reader.readWhitespace();
            while (reader.charsLeft > 0)
            {
                // begin parse definition
                var name = reader.readToken();

                var expressionStack: ExpressionBase[] = [];

                while (true)
                {
                    reader.readWhitespace();

                    // apply
                    if (reader.readChar("."))
                    {
                        if (expressionStack.length < 2)
                            break;
                        var b = expressionStack.pop();
                        var a = expressionStack.pop();
                        if (a instanceof Expression)
                        {
                            (<Expression>a).stack.unshift(b);
                            expressionStack.push(a);
                        }
                        else
                        {
                            expressionStack.push(Expression.createApplication(a, b));
                        }
                        continue;
                    }

                    // defref
                    var defRef = reader.readToken();
                    var def = this.defs[defRef];
                    if (def == undefined)
                        throw "unresolved reference: " + defRef;
                    expressionStack.push(def);
                }

                var content = expressionStack.pop();
                //console.log(name + " = " + content.toString());
                if (this.rodefs[name] == undefined)
                    this.defs[name] = (function (content: ExpressionBase)
                    {
                        return new AliasExpression(name, content);
                    })(content);
                else
                    this.defs[name] = this.rodefs[name];
                // end parse definition

                reader.readWhitespace();
            }
        }
    }
}