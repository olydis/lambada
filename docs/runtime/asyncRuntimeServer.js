importScripts("runtime.js");
var nextId = 0;
onmessage = function (e) {
    // guarantee execution order
    if (e.data.id != nextId)
        throw "expected message " + nextId + " but received " + e.data.id + "; fix: cache unordered messages";
    nextId++;
    var result;
    var elapsedMS;
    var success = true;
    var exception;
    try {
        eval("LambadaRuntime._perfReset()");
        elapsedMS = measure(() => result = eval(e.data.code));
    }
    catch (ex) {
        success = false;
        exception = ex;
        console.warn("ERROR IN: " + e.data.code);
        console.warn(ex);
    }
    postMessage({
        "id": e.data.id,
        "evaluated": success ? result : exception,
        "elapsedMS": elapsedMS,
        "success": success
    });
};
function measure(f) {
    var d1 = new Date().getTime();
    f();
    var d2 = new Date().getTime();
    return d2 - d1;
}
