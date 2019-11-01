var AsyncRuntime = /** @class */ (function () {
    function AsyncRuntime(masterUri, binary) {
        var _this = this;
        this.masterUri = masterUri;
        this.binary = binary;
        this.nextReq = 0;
        this.nextRes = 0;
        this.closed = false;
        this._uid = Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        this.master = new Worker(masterUri);
        this.jobs = [];
        this.master.onmessage = function (e) {
            // handle special ids
            if (e.data.id == -1) {
                AsyncRuntime.onPerf(_this, {
                    nApp: e.data.nApp,
                    nAlloc: e.data.nAlloc,
                    timeBusy: e.data.timeBusy,
                });
                return;
            }
            // handle responses
            if (_this.nextRes != e.data.id)
                throw "unexpected response id (" + e.data.id + " instead of " + _this.nextRes + ")";
            _this.nextRes++;
            if (e.data.success)
                _this.jobs[e.data.id].callback(e.data.evaluated);
            else
                _this.jobs[e.data.id].error(e.data.evaluated);
            delete _this.jobs[e.data.id];
        };
        this.master.onerror = function (e) {
            _this.close();
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
    Object.defineProperty(AsyncRuntime.prototype, "uid", {
        get: function () {
            return this._uid;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AsyncRuntime.prototype, "isIdle", {
        get: function () {
            return this.nextReq == this.nextRes;
        },
        enumerable: true,
        configurable: true
    });
    AsyncRuntime.prototype.clone = function () {
        return new AsyncRuntime(this.masterUri, this.binary);
    };
    AsyncRuntime.prototype.throwException = function (exception) {
        throw "AsyncRuntime-Error: " + exception;
    };
    AsyncRuntime.prototype.post = function (code, callback, error) {
        if (callback === void 0) { callback = function (_) { }; }
        if (error === void 0) { error = this.throwException; }
        if (this.nextReq != this.jobs.length)
            throw "unexpected request id";
        var codex = code.join(";");
        this.jobs.push({ callback: callback, error: error });
        this.master.postMessage({
            "id": this.nextReq,
            "code": codex
        });
        this.nextReq++;
    };
    // fires as soon as anything enqueued before finished
    AsyncRuntime.prototype.onDone = function (callback) {
        this.post([], function (_) { return callback(); });
    };
    // fires as soon as there is no job waiting for its response left
    AsyncRuntime.prototype.onIdle = function (callback) {
        var _this = this;
        if (this.isIdle)
            callback();
        else
            this.onDone(function () { return _this.onIdle(callback); });
    };
    AsyncRuntime.prototype.compile = function (source, callback, error) {
        if (error === void 0) { error = this.throwException; }
        this.post(["app(d.pipe, s(" + JSON.stringify(source) + ")).asString()"], function (binary) {
            binary = binary.replace(/\.\s/g, ".").trim();
            if (binary == "")
                error("compiler error");
            else
                callback(binary == "" ? null : binary);
        }, function (ex) { return error(ex); });
    };
    AsyncRuntime.prototype.eval = function (binary, callback, error) {
        if (error === void 0) { error = this.throwException; }
        this.post([
            "rt.define(" + JSON.stringify("__value ListEmpty.") + ")",
            "rt.define(" + JSON.stringify(binary || "") + ")",
            "d.__value.asString()"
        ], function (result) { return callback(result); }, function (ex) { return error(ex); });
    };
    AsyncRuntime.prototype.getNames = function (callback) {
        this.post(["rt.getNames()"], function (names) { return callback(names); });
    };
    AsyncRuntime.prototype.dumpStats = function (cnt) {
        if (cnt === void 0) { cnt = 10; }
        this.post(["rt.getStats()"], function (stats) { return console.debug(JSON.stringify(stats)); });
    };
    AsyncRuntime.prototype.autoClose = function () {
        var _this = this;
        this.onIdle(function () { return _this.close(); });
    };
    AsyncRuntime.prototype.close = function () {
        if (!this.closed) {
            this.closed = true;
            this.master.terminate();
            this.master = undefined;
            this.post = undefined;
            AsyncRuntime.onClose(this);
        }
    };
    AsyncRuntime.prototype.toString = function () {
        return this.uid + " (#req: " + this.nextReq + ", #res: " + this.nextRes + ")";
    };
    AsyncRuntime.onOpen = function (rt) { console.log("opened client " + rt.toString()); };
    AsyncRuntime.onClose = function (rt) { console.log("closed client " + rt.toString()); };
    AsyncRuntime.onPerf = function (_) { };
    return AsyncRuntime;
}());
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