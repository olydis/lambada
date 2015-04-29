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
    var success: boolean = true;
    var exception: any;
    try
    {
        eval("LambadaRuntime._perfReset()");
        elapsedMS = measure(() => result = eval(e.data.code));
    }
    catch (ex)
    {
        success = false;
        exception = ex;
        console.warn("ERROR IN: " + e.data.code);
        console.warn(ex);
    }
    (<any>postMessage)({
        "id": e.data.id,
        "evaluated": success ? result : exception,
        "elapsedMS": elapsedMS,
        "success": success
    });
}

function measure(f: () => void): number
{
    var d1 = new Date().getTime();
    f();
    var d2 = new Date().getTime();
    return d2 - d1;
}