class AsyncRuntime
{
    private master: Worker;
    private jobCont: ((result: any) => void)[];

    public constructor(masterUri: string, binary: string)
    {
        this.master = new Worker(masterUri);
        this.jobCont = [];

        this.master.onmessage = oEvent =>
        {
            if (this.jobCont[oEvent.data.id])
                this.jobCont[oEvent.data.id](oEvent.data.evaluated);
            delete this.jobCont[oEvent.data.id];
        };
        this.master.onerror = e => { throw "AsyncRuntime-Error: " + e; };

        // setup
        this.post([
                "lrt = LambadaRuntime",
                "rt = lrt.Runtime.create(\"" + binary + "\")", // DANGER
                "d = rt.defs",
                "app = lrt.Expression.createApplicationx",
                "s = lrt.ShortcutExpression.createString",
                "n = lrt.ShortcutExpression.createNumber",
                "null"
            ]);
    }

    private post(code: string[], continuation: (result: any) => void = _ => { })
    {
        var codex = code.join(";");
        this.jobCont.push(continuation);
        this.master.postMessage({
            "id": this.jobCont.length - 1,
            "code": codex
        });
    }
}