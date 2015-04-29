importScripts("runtime.js");

var nextId = 0;

onmessage = function (e)
{
    // guarantee execution order
    if (e.data.id != nextId)
        throw "expected message " + nextId + " but received " + e.data.id + "; fix: cache unordered messages";
    nextId++;

    var result: any;
    var elapsedMS: number;
    try
    {
        elapsedMS = measure(() => result = eval(e.data.code));
    }
    catch (ex)
    {
        console.log("ERROR IN: " + e.data.code);
        throw ex;
    }
    (<any>postMessage)({
        "id": e.data.id,
        "evaluated": result,
        "elapsedMS": elapsedMS
    });
}

function measure(f: () => void): number
{
    var d1 = new Date().getTime();
    f();
    var d2 = new Date().getTime();
    return d2 - d1;
}