class StringReader
{
    private len: number;
    private index: number;
    
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

    public readNaturalNumber(): number
    {
        var num = this.readWhile(ch => /^[0-9]$/.test(ch));
        return num == "" ? null : parseInt(num);
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
}

class Runtime
{
    public static create(binary: string): Runtime
    {
        var rt = new Runtime();
        rt.define(binary);
        return rt;
    }
    
    private defs: { [name: string]: AliasExpression };
    
    public constructor()
    {
        this.defs = {};

        var def = (name: string, expr: ExpressionBase) =>
        {
            this.defs[name] = new AliasExpression(name, expr);
        };

        def("i", new BuiltinExpression(stack => stack.length >= 0));
        def("k", new BuiltinExpression(stack => stack.length >= 2, stack =>
        {
            var x = stack.pop();
            stack.pop();
            stack.push(x);
        }));
        def("s", new BuiltinExpression(stack => stack.length >= 3, stack =>
        {
            var a = stack.pop();
            var b = stack.pop();
            var c = stack.pop();
            stack.push(Expression.createApplication(b, c));
            stack.push(c);
            stack.push(a);
        }));
        def("b", new BuiltinExpression(stack => stack.length >= 3, stack =>
        {
            var a = stack.pop();
            var b = stack.pop();
            var c = stack.pop();
            stack.push(Expression.createApplication(b, c));
            stack.push(a);
        }));
        def("c", new BuiltinExpression(stack => stack.length >= 3, stack =>
        {
            var a = stack.pop();
            var b = stack.pop();
            var c = stack.pop();
            stack.push(b);
            stack.push(c);
            stack.push(a);
        }));
        def("u", new BuiltinExpression(stack => stack.length >= 1, stack =>
        {
            var x = stack.pop();
            stack.push(this.defs["k"]);
            stack.push(this.defs["s"]);
            stack.push(x);
        }));

        def("add", new BuiltinExpression(stack => stack.length >= 2, stack =>
        {
            var x = stack.pop().asNumber();
            var y = stack.pop().asNumber();
            stack.push(ShortcutExpression.createNumber(x + y));
        }));

        def("sub", new BuiltinExpression(stack => stack.length >= 2, stack =>
        {
            var x = stack.pop().asNumber();
            var y = stack.pop().asNumber();
            stack.push(ShortcutExpression.createNumber(x - y));
        }));
        def("strCons", new BuiltinExpression(stack => stack.length >= 2, stack =>
        {
            var x = stack.pop().asString();
            var y = stack.pop().asString();
            stack.push(ShortcutExpression.createString(x + y));
        }));

        def("msgBox", new BuiltinExpression(stack => stack.length >= 1, stack => window.alert(stack[stack.length - 1].toString())));
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

                // num
                var num = reader.readNaturalNumber();
                if (num != null)
                {
                    expressionStack.push(ShortcutExpression.createNumber(num));
                    continue;
                }

                // string
                if (reader.readChar("\""))
                {
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

            if (this.defs[name] == undefined)
            {
                var content = expressionStack.pop();
                console.log(name + " = " + content.toString());
                this.defs[name] = (function(content: ExpressionBase)
                {
                    return new AliasExpression(name, content);
                })(content);
            }
            // end parse definition

            reader.readWhitespace();
        }
    }
}

class ExpressionBase
{
    public apply(stack: ExpressionBase[]): boolean { return false; }
    public reduce(): boolean { return false; }

    public static reductions = 0;

    public fullReduce(): void
    {
        while (this.reduce()) ExpressionBase.reductions++;
    }
    
    
    public asNumber(): number
    {
        var n = 0;
        var probeN: ExpressionBase;
        var probeZero = new BuiltinExpression(stack => false);
        var probeSucc = new BuiltinExpression(stack => stack.length >= 1, stack =>
        {
            n++;
            stack.push(probeN);
        });
        probeN = new BuiltinExpression( 
            stack => stack.length >= 1, 
            stack => 
            {
                var num = stack.pop();
                if (ShortcutExpression.isType(num, ShortcutType.N))
                {
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
    }
    
    public asString(): string
    {
        var s = "";
        var probeS: ExpressionBase;
        var probeEmpty = new BuiltinExpression(stack => false);
        var probeCons = new BuiltinExpression(stack => stack.length >= 2, stack =>
        {
            s += String.fromCharCode(stack.pop().asNumber());
            stack.push(probeS);
        });
        probeS = new BuiltinExpression( 
            stack => stack.length >= 1, 
            stack => 
            {
                var num = stack.pop();
                if (ShortcutExpression.isType(num, ShortcutType.S))
                {
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
    
    public toString(): string
    {
        // DEBUG
        //if (arguments.callee.caller == null 
        //|| arguments.callee.caller.toString().indexOf("toString") == -1)
        //    return this.slave.toString();
        
        return this.alias;
    }
}

enum ShortcutType
{
    N,
    S
}

class ShortcutExpression<T> extends AliasExpression
{
    public static createNumber(n: number): ShortcutExpression<number>
    {
        var res = Expression.createADTo(2, 0);
        for (var i = 0; i < n; i++)
            res = Expression.createADTo(2, 1, res);
        var se = new ShortcutExpression<number>(ShortcutType.N, n, n.toString(), res);
        se.asNumber = () => n;
        return se;
    }
    private static createList(exprs: ExpressionBase[]): ExpressionBase
    {
        var res = Expression.createADTo(2, 0);
        for (var i = exprs.length - 1; i >= 0; i--)
            res = Expression.createADTo(2, 1, exprs[i], res);
        return res;
    }
    public static createString(s: string): ShortcutExpression<string>
    {
        var list = ShortcutExpression.createList(s.split("").map(ch => ShortcutExpression.createNumber(ch.charCodeAt(0))));
        var se = new ShortcutExpression<string>(ShortcutType.S, s, "\"" + s + "\"", list);
        se.asString = () => s;
        return se;
    }

    public static isType(expression: ExpressionBase, stype: ShortcutType): boolean
    {
        return (<ShortcutExpression<any>>expression).stype == stype;
    }

    public constructor(public stype: ShortcutType, public value: T, alias: string, slave: ExpressionBase)
    {
        super(alias, slave);
    }
}

class Expression extends ExpressionBase
{
    public static createADTo(arity: number, index: number, ...args: ExpressionBase[]): ExpressionBase
    {
        return new AliasExpression("ADTo_" + index + "_" + arity, new BuiltinExpression(stack => stack.length >= arity, stack =>
        {
            var head: ExpressionBase = stack[stack.length - index - 1];

            for (var i = 0; i < arity; i++)
                stack.pop();

            for (var i = args.length - 1; i >= 0; i--)
                stack.push(args[i]);
            stack.push(head);
        }));
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

    private static createDummy(name: string): ExpressionBase
    {
        return new AliasExpression(name, new BuiltinExpression(stack => false));
    }
    
    public stack: ExpressionBase[];

    public constructor()
    {
        super();
        this.stack = [];
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
        var exprs = this.leftmostExprs;
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

    private get top(): ExpressionBase
    {
        return this.stack[this.stack.length - 1];
    }

    private get leftmostExprs(): Expression[]
    {
        var expr = [this];
        while (true)
        {
            var top = expr[expr.length - 1].top;
            if (top instanceof Expression && top.stack.length > 0)
                expr.push(top);
            else
                return expr;
        }
    }

    public toString(): string
    {
        var res = "";
        this.stack.forEach(x => res = x.toString() + " " + res);
        return "(" + res.trim() + ")";
    }
}
class BuiltinExpression extends ExpressionBase
{
    public constructor(
        private test: (stack: ExpressionBase[]) => boolean,
        private applyTo: (stack: ExpressionBase[]) => void = x => { })
    {
        super();
    }

    public apply(stack: ExpressionBase[]): boolean
    {
        var result = this.test(stack);
        if (result) this.applyTo(stack);
        return result;
    }

    public reduce(): boolean
    {
        return false;
    }
}