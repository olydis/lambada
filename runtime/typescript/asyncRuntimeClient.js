var AsyncRuntime = (function () {
    function AsyncRuntime(masterUri, binary) {
        var _this = this;
        this.master = new Worker(masterUri);
        this.jobCallback = [];
        this.master.onmessage = function (oEvent) {
            if (_this.jobCallback[oEvent.data.id])
                _this.jobCallback[oEvent.data.id](oEvent.data.evaluated);
            delete _this.jobCallback[oEvent.data.id];
        };
        this.master.onerror = function (e) {
            throw "AsyncRuntime-Error: " + e;
        };
        // setup
        this.post([
            "lrt = LambadaRuntime",
            "rt = lrt.Runtime.create(" + JSON.stringify(binary) + ")",
            "d = rt.defs",
            "app = lrt.Expression.createApplicationx",
            "s = lrt.ShortcutExpression.createString",
            "n = lrt.ShortcutExpression.createNumber",
            "null"
        ]);
    }
    AsyncRuntime.prototype.post = function (code, callback) {
        if (callback === void 0) { callback = function (_) {
        }; }
        var codex = code.join(";");
        this.jobCallback.push(callback);
        this.master.postMessage({
            "id": this.jobCallback.length - 1,
            "code": codex
        });
    };
    AsyncRuntime.prototype.onDone = function (continuation) {
        this.post([], function (_) { return continuation(); });
    };
    AsyncRuntime.prototype.compile = function (source, callback) {
        this.post(["app(d.pipe, s(" + JSON.stringify(source) + ")).asString()"], function (binary) {
            binary = binary.replace(/\.\s/g, ".").trim();
            callback(binary == "" ? null : binary);
        });
    };
    AsyncRuntime.prototype.eval = function (source, callback) {
        this.post([
            "temp = app(d.pipe, s(" + JSON.stringify("__probe = " + source) + ")).asString()",
            "rt.define(temp.trim() == \"\" ? \"__probe ListEmpty.\" : temp)",
            "d.__probe.asString()"
        ], function (result) { return callback(result); });
    };
    AsyncRuntime.prototype.getNames = function (callback) {
        this.post(["rt.getNames()"], function (names) { return callback(names); });
    };
    return AsyncRuntime;
})();
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
//# sourceMappingURL=asyncRuntimeClient.js.map