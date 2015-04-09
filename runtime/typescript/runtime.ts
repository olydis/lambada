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
        return readWhile(ch => /^\s$/.test(ch));
    }
    
    public readToken(): string
    {
        return readWhile(ch => /^[a-zA-Z0-9]$/.test(ch));
    }
}

class Runtime
{
    public static create(binary: string): Runtime
    {
        var rt = new Runtime();
        binary
            .split("\n")
            .forEach(s => rt.define(s));
        return rt;
    }
    
    private defs: { [name: string]: Expression };
    
    public constructor()
    {
        
    }
    
    public define(binaryDefinition: string): void
    {
        window.alert(binaryDefinition);
    }
    
    
}

class Expression
{
    
}

