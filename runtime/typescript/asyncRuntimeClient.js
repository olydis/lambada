var AsyncRuntime = (function () {
    function AsyncRuntime(masterUri, binary) {
        var _this = this;
        this.master = new Worker(masterUri);
        this.jobCont = [];
        this.master.onmessage = function (oEvent) {
            if (_this.jobCont[oEvent.data.id])
                _this.jobCont[oEvent.data.id](oEvent.data.evaluated);
            delete _this.jobCont[oEvent.data.id];
        };
        this.master.onerror = function (e) {
            throw "AsyncRuntime-Error: " + e;
        };
        // setup
        this.post([
            "lrt = LambadaRuntime",
            "rt = lrt.Runtime.create(\"" + binary + "\")",
            "d = rt.defs",
            "app = lrt.Expression.createApplicationx",
            "s = lrt.ShortcutExpression.createString",
            "n = lrt.ShortcutExpression.createNumber",
            "null"
        ]);
    }
    AsyncRuntime.prototype.post = function (code, continuation) {
        if (continuation === void 0) { continuation = function (_) {
        }; }
        var codex = code.join(";");
        this.jobCont.push(continuation);
        this.master.postMessage({
            "id": this.jobCont.length - 1,
            "code": codex
        });
    };
    return AsyncRuntime;
})();
//# sourceMappingURL=asyncRuntimeClient.js.map