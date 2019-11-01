class AsyncRuntime {
    constructor(masterUri, binary) {
        this.masterUri = masterUri;
        this.binary = binary;
        this.nextReq = 0;
        this.nextRes = 0;
        this.closed = false;
        this._uid = Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        this.master = new Worker(masterUri);
        this.jobs = [];
        this.master.onmessage = e => {
            // handle special ids
            if (e.data.id == -1) {
                AsyncRuntime.onPerf(this, {
                    nApp: e.data.nApp,
                    nAlloc: e.data.nAlloc,
                    timeBusy: e.data.timeBusy,
                });
                return;
            }
            // handle responses
            if (this.nextRes != e.data.id)
                throw "unexpected response id (" + e.data.id + " instead of " + this.nextRes + ")";
            this.nextRes++;
            if (e.data.success)
                this.jobs[e.data.id].callback(e.data.evaluated);
            else
                this.jobs[e.data.id].error(e.data.evaluated);
            delete this.jobs[e.data.id];
        };
        this.master.onerror = e => {
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
        AsyncRuntime.onOpen(this);
    }
    get uid() {
        return this._uid;
    }
    get isIdle() {
        return this.nextReq == this.nextRes;
    }
    clone() {
        return new AsyncRuntime(this.masterUri, this.binary);
    }
    throwException(exception) {
        throw "AsyncRuntime-Error: " + exception;
    }
    post(code, callback = _ => { }, error = this.throwException) {
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
    onDone(callback) {
        this.post([], _ => callback());
    }
    // fires as soon as there is no job waiting for its response left
    onIdle(callback) {
        if (this.isIdle)
            callback();
        else
            this.onDone(() => this.onIdle(callback));
    }
    compile(source, callback, error = this.throwException) {
        this.post(["app(d.pipe, s(" + JSON.stringify(source) + ")).asString()"], (binary) => {
            binary = binary.replace(/\.\s/g, ".").trim();
            if (binary == "")
                error("compiler error");
            else
                callback(binary == "" ? null : binary);
        }, ex => error(ex));
    }
    eval(binary, callback, error = this.throwException) {
        this.post([
            "rt.define(" + JSON.stringify("__value ListEmpty.") + ")",
            "rt.define(" + JSON.stringify(binary || "") + ")",
            "d.__value.asString()"
        ], (result) => callback(result), ex => error(ex));
    }
    getNames(callback) {
        this.post(["rt.getNames()"], (names) => callback(names));
    }
    dumpStats(cnt = 10) {
        this.post(["rt.getStats()"], stats => console.debug(JSON.stringify(stats)));
    }
    autoClose() {
        this.onIdle(() => this.close());
    }
    close() {
        if (!this.closed) {
            this.closed = true;
            this.master.terminate();
            this.master = undefined;
            this.post = undefined;
            AsyncRuntime.onClose(this);
        }
    }
    toString() {
        return this.uid + " (#req: " + this.nextReq + ", #res: " + this.nextRes + ")";
    }
}
AsyncRuntime.onOpen = rt => { console.log("opened client " + rt.toString()); };
AsyncRuntime.onClose = rt => { console.log("closed client " + rt.toString()); };
AsyncRuntime.onPerf = _ => { };
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
//# sourceMappingURL=asyncRuntimeClient.js.map