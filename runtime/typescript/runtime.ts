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
    
    private defs: { [name: string]: ExpressionBase };
    
    public constructor()
    {
        this.defs = { };
        this.defs["i"] = new BuiltinExpression("i", stack => stack.length >= 1);
        this.defs["k"] = new BuiltinExpression("k", stack => stack.length >= 2, stack =>
        {
            var x = stack.pop();
            stack.pop();
            stack.push(x);
        });
        this.defs["s"] = new BuiltinExpression("s", stack => stack.length >= 3, stack =>
        {
            var a = stack.pop();
            var b = stack.pop();
            var c = stack.pop();
            stack.push(Expression.createApplication(a, c, Expression.createApplication(b, c)));
        });
        this.defs["b"] = new BuiltinExpression("b", stack => stack.length >= 3, stack =>
        {
            var a = stack.pop();
            var b = stack.pop();
            var c = stack.pop();
            stack.push(Expression.createApplication(a, Expression.createApplication(b, c)));
        });
        this.defs["c"] = new BuiltinExpression("c", stack => stack.length >= 3, stack =>
        {
            var a = stack.pop();
            var b = stack.pop();
            var c = stack.pop();
            stack.push(Expression.createApplication(a, c, b));
        });
        this.defs["u"] = new BuiltinExpression("u", stack => stack.length >= 1, stack =>
        {
            var x = stack.pop();
            stack.push(this.defs["k"]);
            stack.push(this.defs["s"]);
            stack.push(x);
        });


        this.defs["msgBox"] = new BuiltinExpression("msgBox", stack => stack.length >= 1, stack => window.alert(stack[stack.length - 1].toString()));
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
                    expressionStack.push(Expression.createNumber(num));
                    continue;
                }

                // string
                if (reader.readChar("\""))
                {
                    var s = reader.readWhile(ch => ch != "\"");
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
    public fullReduce(): void { while (this.reduce()); }
    
    
    public asNumber(): number
    {
        var n = 0;
        var probeN: ExpressionBase;
        var probeZero = new BuiltinExpression("probeZero", stack => false);
        var probeSucc = new BuiltinExpression("probeSucc", stack => stack.length >= 1, stack =>
        {
            n++;
            stack.push(Expression.createApplication(probeN, stack.pop()));
        });
        probeN = new BuiltinExpression("probeN", 
            stack => stack.length >= 1, 
            stack => 
            {
                var num = stack.pop();
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
        var probeEmpty = new BuiltinExpression("probeEmpty", stack => false);
        var probeCons = new BuiltinExpression("probeCons", stack => stack.length >= 2, stack =>
        {
            s += String.fromCharCode(stack.pop().asNumber());
            stack.push(Expression.createApplication(probeS, stack.pop()));
        });
        probeS = new BuiltinExpression("probeS", 
            stack => stack.length >= 1, 
            stack => 
            {
                var num = stack.pop();
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
    public constructor(private alias: string, private slave: ExpressionBase)
    {
        super();
    }
    
    public apply(stack: ExpressionBase[]): boolean { return this.slave.apply(stack); }
    public reduce(): boolean { return this.slave.reduce(); }
    
    public toString(): string
    {
        // DEBUG
        if (arguments.callee.caller == null 
        || arguments.callee.caller.toString().indexOf("toString") == -1)
            return this.slave.toString();
        
        return this.alias;
    }
}

class Expression extends ExpressionBase
{
    public static createADTo(arity: number, index: number, ...args: ExpressionBase[]): ExpressionBase
    {
        return new BuiltinExpression("ADTo_" + index + "_" + arity, stack => stack.length >= arity, stack =>
        {
            var result: ExpressionBase;
            for (var i = 0; i < arity; i++)
                if (i == index)
                    result = Expression.createApplication.apply(null, [stack.pop()].concat(args));
                else
                    stack.pop();
            stack.push(result);
        });
    }
    public static createNumber(n: number): ExpressionBase
    {
        var res = Expression.createADTo(2, 0);
        while (n-- != 0)
            res = Expression.createADTo(2, 1, res);
        return res;
    }
    public static createList(exprs: ExpressionBase[]): ExpressionBase
    {
        var res = Expression.createADTo(2, 0);
        for (var i = exprs.length - 1; i >= 0; i--)
            res = Expression.createADTo(2, 1, exprs[i], res);
        return res;
    }
    public static createString(s: string): ExpressionBase
    {
        return Expression.createList(s.split("").map(ch => Expression.createNumber(ch.charCodeAt(0))));
    }

    public static createApplication(...expressions: ExpressionBase[]): ExpressionBase
    {
        var e = new Expression();
        Array.prototype.push.apply(e.stack, expressions);
        e.stack.reverse();
        return e;
    }

    private static createDummy(name: string): ExpressionBase
    {
        return new BuiltinExpression(name, stack => false);
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

    public reduce(): boolean
    {
        var top = this.stack.pop();
        if (top.reduce())
            this.stack.push(top);
        else if (!top.apply(this.stack))
        {
            this.stack.push(top);
            return false;
        }
        return true;
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
    private called: number = 0;
    
    public constructor(
        private name: string,
        private test: (stack: ExpressionBase[]) => boolean,
        private applyTo: (stack: ExpressionBase[]) => void = x => { })
    {
        super();
    }

    public apply(stack: ExpressionBase[]): boolean
    {
        this.called++;
        var result = this.test(stack);
        if (result) this.applyTo(stack);
        return result;
    }

    public reduce(): boolean
    {
        return false;
    }

    public toString(): string
    {
        return this.name;
    }
}