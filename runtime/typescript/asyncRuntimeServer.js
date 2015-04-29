importScripts("runtime.js");
var nextId = 0;
onmessage = function (e) {
    // guarantee execution order
    if (e.data.id != nextId)
        throw "expected message " + nextId + " but received " + e.data.id + "; fix: cache unordered messages";
    nextId++;
    var result;
    var elapsedMS;
    try {
        elapsedMS = measure(function () { return result = eval(e.data.code); });
    }
    catch (ex) {
        console.log("ERROR IN: " + e.data.code);
        throw ex;
    }
    postMessage({
        "id": e.data.id,
        "evaluated": result,
        "elapsedMS": elapsedMS
    });
};
function measure(f) {
    var d1 = new Date().getTime();
    f();
    var d2 = new Date().getTime();
    return d2 - d1;
}
//# sourceMappingURL=asyncRuntimeServer.js.map