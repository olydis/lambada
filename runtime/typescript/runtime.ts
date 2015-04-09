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
    
    private defs: Expression[];
    
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

