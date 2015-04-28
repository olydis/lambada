importScripts("runtime.js");
var nextId = 0;
onmessage = function (e) {
    if (e.data.id != nextId)
        throw "expected message " + nextId + " but received " + e.data.id + "; fix: cache unordered messages";
    nextId++;
    postMessage({
        "id": e.data.id,
        "evaluated": eval(e.data.code)
    });
};
//# sourceMappingURL=asyncRuntimeMaster.js.map