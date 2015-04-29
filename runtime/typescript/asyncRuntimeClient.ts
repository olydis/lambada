﻿class AsyncRuntime
{
    private uid: string;

    private master: Worker;
    private jobs: { callback: ((result: any) => void); error: ((exception: any) => void) }[];

    private nextReq: number = 0;
    private nextRes: number = 0;

    public get isIdle(): boolean
    {
        return this.nextReq == this.nextRes;
    }

    public constructor(private masterUri: string, private binary: string)
    {
        this.uid = Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        this.master = new Worker(masterUri);
        this.jobs = [];

        this.master.onmessage = e =>
        {
            if (this.nextRes != e.data.id)
                throw "unexpected response id";
            this.nextRes++;

            if (e.data.success)
                this.jobs[e.data.id].callback(e.data.evaluated);
            else
                this.jobs[e.data.id].error(e.data.evaluated);

            delete this.jobs[e.data.id];
        };
        this.master.onerror = e =>
        {
            this.close();
            // panic, because should have been handled by server ==> unexpected behaviour
            throw "AsyncRuntime-PANIC: " + e;
        };

        // setup
        this.post([
            "uid = " + JSON.stringify(this.uid),
            "lrt = LambadaRuntime",
            "rt = lrt.Runtime.create(" + JSON.stringify(binary) + ")",
            "d = rt.defs",
            "app = lrt.Expression.createApplicationx",
            "s = lrt.ShortcutExpression.createString",
            "n = lrt.ShortcutExpression.createNumber",
            "null"
        ]);

        console.log("opened client " + this.toString());
    }

    public clone(): AsyncRuntime
    {
        return new AsyncRuntime(this.masterUri, this.binary);
    }

    private throwException(exception: any)
    {
        throw "AsyncRuntime-Error: " + exception;
    }

    private post(code: string[], callback: (result: any) => void = _ => { }, error: (exception: any) => void = this.throwException)
    {
        if (this.nextReq != this.jobs.length)
            throw "unexpected request id";

        var codex = code.join(";");
        this.jobs.push({ callback: callback, error: error });
        this.master.postMessage({
            "id": this.nextReq,
            "code": codex
        });
        this.nextReq++;
    }

    // fires as soon as anything enqueued before finished
    public onDone(callback: () => void)
    {
        this.post([], _ => callback());
    }

    // fires as soon as there is no job waiting for its response left
    public onIdle(callback: () => void)
    {
        if (this.isIdle)
            callback();
        else
            this.onDone(() => this.onIdle(callback));
    }

    public compile(source: string, callback: (binary: string) => void, error: (exception: any) => void = this.throwException)
    {
        this.post(["app(d.pipe, s(" + JSON.stringify(source) + ")).asString()"],
            (binary: string) =>
            {
                binary = binary.replace(/\.\s/g, ".").trim();
                if (binary == "")
                    error("compiler error");
                else
                    callback(binary == "" ? null : binary);
            },
            ex => error(ex));
    }

    public eval(binary: string, callback: (result: string) => void, error: (exception: any) => void = this.throwException)
    {
        this.post([
            "rt.define(" + JSON.stringify("__value ListEmpty.") + ")",
            "rt.define(" + JSON.stringify(binary || "") + ")",
            "d.__value.asString()"],
            (result: string) => callback(result),
            ex => error(ex));
    }

    public getNames(callback: (names: string[]) => void)
    {
        this.post(["rt.getNames()"],(names: string[]) => callback(names));
    }
    

    public autoClose(): void
    {
        this.onIdle(() => this.close());
    }

    public close(): void
    {
        this.master.terminate();
        this.master = undefined;
        this.post = undefined;

        console.log("closed client " + this.toString());
    }

    public toString()
    {
        return this.uid + " (#req: " + this.nextReq + ", #res: " + this.nextRes + ")";
    }
}





//var stats: (cnt: number) => string;
//var rstats: () => void;
//stats = (cnt: number) =>
//{
//    if (cnt == undefined) cnt = 10;
//    var x: LambadaRuntime.ExpressionBase[] = [];
//    for (var prop in d) x.push(d[prop]);
//    x = x.sort((a, b) => (<any>b).called - (<any>a).called);
//    return x.slice(0, cnt).map(y => "{ n: " + (<any>y).alias + ", " + "c: " + (<any>y).called + " }").join("\n");
//};
//rstats = () => { for (var prop in d) d[prop].called = 0; };


//function runTests()
//{
//    // automated
//    var tc = d["testCount"].asNumber();
//    var dddiff = measure(() =>
//    {
//        for (var i = 0; i < tc; i++)
//        {
//            var prop = "test" + i;
//            var succ: boolean;
//            var ddiff = measure(() => { succ = app(d["strFromB"], d[prop]).asString() != "True"; });
//            if (succ)
//                throw prop + " failed";
//            //else
//            //    console.log(prop + " passed in " + ddiff + "ms");
//        }
//    });
//    console.log(tc + " tests passed in " + dddiff + "ms");
            
//    // execution speed (1.000.000 x operation)
//    // K
//    var kTest = d["k"];
//    for (var i = 0; i < 1000000 * 2; i++)
//        kTest = app(kTest, d["k"]);
//    console.log("K: " + measure(() => kTest.fullReduce()) + "ms");
//}

//function leval(expr: string)
//{
//    return app(
//        d["maybeTryGetValue"],
//        app(d["run2"], rt, s(expr)),
//        s("error"));
//}
//function exec(expr: string)
//{
//    var result = leval(expr);
//    result.fullReduce();
//    return result.toString();
//}